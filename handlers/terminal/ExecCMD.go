// Package terminal is generated by Handlergenerator tooling
// Make sure to insert real Description here
package terminal

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
	"github.com/percybolmer/workflow/register"
)

// ExecCMD is used to execute a commandline command. This can be used to extend and use functions that are not part of the Workflow atm.
type ExecCMD struct {
	// Cfg is values needed to properly run the Handle func
	Cfg  *property.Configuration `json:"configs" yaml:"configs"`
	Name string                  `json:"handler_name" yaml:"handler_name"`
	// command is the command to run in terminal
	command string
	// arguments is a set of arugments to include in the command
	arguments []string
	// Subscriptionless is set to true if Payload is set in the arguments
	subscriptionless bool
	// appendOldPayload is a value that can be set to add the exec output to the old payload, used if you want to keep the payload that went into this one
	appendOldPayload bool
	// appendDelimiter is a value that will be set to seperate the newpayload
	appendDelimiter string
	errChan         chan error
	metrics         metric.Provider
	metricPrefix    string
	// MetricPayloadOut is how many payloads the processor has outputted
	MetricPayloadOut string
	// MetricPayloadIn is how many payloads the processor has inputted
	MetricPayloadIn string
}

var (
	// ErrNoPayload is thrown when trying to exec command with empty payload
	ErrNoPayload = errors.New("cannot execute a payload command with empty payload")
	// ErrEmptyCommand is when trying to run Exec without a Command set
	ErrEmptyCommand = errors.New("cannot run this Handler without a command set in configuration, also make sure ValidateConfiguration is run")
)

func init() {
	register.Register("ExecCMD", NewExecCMDHandler())
}

// NewExecCMDHandler generates a new ExecCMD Handler
func NewExecCMDHandler() *ExecCMD {
	act := &ExecCMD{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:             "ExecCMD",
		errChan:          make(chan error, 1000),
		appendOldPayload: false,
	}
	act.Cfg.AddProperty("command", "the command to run ", true)
	act.Cfg.AddProperty("arguments", "The arguments to add to the command, if this list of arguments contains the word payload, It will print the payload of the incomming payload as an argument", false)
	act.Cfg.AddProperty("append_old_payload", "Setting this to true will make the output of the handler become the oldpayload + the exec payload", false)
	act.Cfg.AddProperty("append_delimiter", "The value to seperate payloads with", false)

	return act
}

// GetHandlerName is used to retrun a unqiue string name
func (a *ExecCMD) GetHandlerName() string {
	return a.Name
}

// Handle is used to execute a Command if its set and ValidateConfiguration has been
// properly run
func (a *ExecCMD) Handle(ctx context.Context, input payload.Payload, topics ...string) error {
	a.metrics.IncrementMetric(a.MetricPayloadIn, 1)
	pay, err := a.Exec(input)
	if err != nil {
		return err
	}
	a.metrics.IncrementMetric(a.MetricPayloadOut, 1)

	errs := pubsub.PublishTopics(topics, pay)
	if errs != nil {
		for _, err := range errs {
			a.errChan <- err
		}
	}
	return nil
}

// Exec will execute the command
func (a *ExecCMD) Exec(input payload.Payload) (payload.Payload, error) {
	if a.command == "" {
		return nil, ErrEmptyCommand
	}
	command := a.command
	for _, value := range a.arguments {
		if strings.Contains(value, "payload") {
			// If payload argument is set it is used to insert payload here, so it cannot be nil
			if input == nil {
				return nil, ErrNoPayload
			}
			payFlag := strings.Replace(value, "payload", string(input.GetPayload()), -1)
			command += " " + payFlag
		} else {
			command += " " + value
		}
	}

	// Lets Exec the command
	fullCmd := exec.Command("bash", "-c", command)
	var stdout, stderr bytes.Buffer
	fullCmd.Stderr = &stderr
	fullCmd.Stdout = &stdout
	err := fullCmd.Run()
	if err != nil {
		return nil, fmt.Errorf("%s:%w", fullCmd.String(), err)
	}

	errStr := string(stderr.Bytes())
	if errStr != "" {
		return nil, errors.New(errStr)
	}
	var newPayload *payload.BasePayload
	if a.appendOldPayload {
		data := input.GetPayload()
		data = append(data, []byte(a.appendDelimiter)...)
		data = append(data, stdout.Bytes()...)
		newPayload = payload.NewBasePayload(data, fullCmd.String(), input.GetMetaData())
	} else {
		newPayload = payload.NewBasePayload(stdout.Bytes(), fullCmd.String(), input.GetMetaData())
	}

	return newPayload, nil
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *ExecCMD) ValidateConfiguration() (bool, []string) {
	// Check if Cfgs are there as needed
	commandProp := a.Cfg.GetProperty("command")
	argumentsProp := a.Cfg.GetProperty("arguments")
	delimiterProp := a.Cfg.GetProperty("append_delimiter")
	appendProp := a.Cfg.GetProperty("append_old_payload")

	if commandProp.Value == nil {
		return false, []string{"Missing command property"}
	}

	command := commandProp.String()
	a.command = command

	if appendProp != nil && appendProp.Value != nil {
		appendBool, err := appendProp.Bool()
		if err != nil {
			return false, []string{err.Error()}
		}
		a.appendOldPayload = appendBool
	}
	if delimiterProp != nil && delimiterProp.Value != nil {
		delimiter := delimiterProp.String()
		a.appendDelimiter = delimiter
	}
	if argumentsProp.Value != nil {
		splice, err := argumentsProp.StringSplice()
		if err != nil {
			return false, []string{err.Error()}
		}
		for _, arg := range splice {
			if arg == "payload" {
				// This should make INGRESS not required since we expect payloads
				a.subscriptionless = false
			}
		}
		a.arguments = splice

	}

	return true, nil
}

// GetConfiguration will return the CFG for the Handler
func (a *ExecCMD) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return true/false if the Handler is genereating payloads itself
func (a *ExecCMD) Subscriptionless() bool {
	return a.subscriptionless
}

// GetErrorChannel will return a channel that the Handler can output eventual errors onto
func (a *ExecCMD) GetErrorChannel() chan error {
	return a.errChan
}

// SetMetricProvider is used to change what metrics provider is used by the handler
func (a *ExecCMD) SetMetricProvider(p metric.Provider, prefix string) error {
	a.metrics = p
	a.metricPrefix = prefix

	a.MetricPayloadIn = fmt.Sprintf("%s_payloads_in", prefix)
	a.MetricPayloadOut = fmt.Sprintf("%s_payloads_out", prefix)
	err := a.metrics.AddMetric(&metric.Metric{
		Name:        a.MetricPayloadOut,
		Description: "keeps track of how many payloads the handler has outputted",
	})
	if err != nil {
		return err
	}
	err = a.metrics.AddMetric(&metric.Metric{
		Name:        a.MetricPayloadIn,
		Description: "keeps track of how many payloads the handler has ingested",
	})
	return err
}
