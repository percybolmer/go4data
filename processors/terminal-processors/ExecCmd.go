// Package terminalprocessors containts processors that relate to terminal based actions
// etc Execute commands etc
package terminalprocessors

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/processors/processmanager"
	"github.com/percybolmer/workflow/properties"
	"github.com/percybolmer/workflow/relationships"
)

var (
	// ErrNoPayload is thrown when command does not get a payload
	ErrNoPayload = errors.New("cannot execute command that needs payload data with a nil payload")
)

// ExecCmd is used to execute command line arguments
type ExecCmd struct {
	Name                    string `json:"name,omitempty" yaml:"name,omitempty"`
	running                 bool
	cancel                  context.CancelFunc
	ingress                 relationships.PayloadChannel
	egress                  relationships.PayloadChannel
	failures                relationships.FailurePipe
	*properties.PropertyMap `json:"properties,omitempty" yaml:"properties,omitempty"`
	*metric.Metrics         `json:"metrics,omitempty" yaml:",inline,omitempty"`

	command     string
	needingress bool
	arguments   []string
	interval    time.Duration
}

// init is used to Register the processor to the processmanager
func init() {
	err := processmanager.RegisterProcessor("ExecCmd", NewExecCmdInterface)
	if err != nil {
		panic(err)
	}
}

// NewExecCmdInterface is used to return the Proccssor as interface
// This is to avoid Cyclic imports, we are not allowed to return processors.Processor
// so, let processmanager deal with the type assertion
func NewExecCmdInterface() interface{} {
	return NewExecCmd()
}

// NewExecCmd is used to initialize and generate a new processor
func NewExecCmd() *ExecCmd {
	proc := &ExecCmd{
		egress:      make(relationships.PayloadChannel, 1000),
		PropertyMap: properties.NewPropertyMap(),
		Metrics:     metric.NewMetrics(),
		Name:        "ExecCmd",
	}

	proc.AddAvailableProperty("command", "The command that should be run")
	proc.AddAvailableProperty("arguments", "The arguments to add to the command, if this list of arguments contains the word payload, It will print the payload of the incomming payload as an argument")
	proc.AddAvailableProperty("interval", "How often the command should be run, note this cannot be applied if you have a payload, see Tests for examples")
	// Add Required Props -- remove_after
	proc.AddRequirement("command")
	return proc
}

// GetName returns the unique name of the processor
func (proc *ExecCmd) GetName() string {
	return proc.Name
}

// Initialize will make sure all needed Properties and Metrics are generated
// If the Arguments Property is set and Contains a Payload field, it will set ingressNeeded to true
// Interval property will be skipped if ingress is needed
func (proc *ExecCmd) Initialize() error {

	// Make sure Properties are there
	ok, _ := proc.ValidateProperties()
	if !ok {
		return properties.ErrRequiredPropertiesNotFulfilled
	}
	// If you need to read data from Properties and add to your Processor struct, this is the place to do it
	command := proc.GetProperty("command")
	// this error check can never occur if Validate works ...right?
	if command == nil {
		return properties.ErrRequiredPropertiesNotFulfilled
	}
	proc.command = command.String()

	arguments := proc.GetProperty("arguments")
	if arguments != nil {
		// Add Arguments
		splice, err := arguments.StringSplice()
		if err != nil {
			return err
		}
		for _, arg := range splice {
			if arg == "payload" {
				proc.needingress = true
			}
		}
		proc.arguments = splice
	}

	intervalProp := proc.GetProperty("interval")
	if intervalProp != nil && !proc.needingress {
		// Convert to time.Duration
		i, err := intervalProp.Int()
		if err != nil {
			return err
		}
		proc.interval = time.Second * time.Duration(i)
	}
	return nil
}

// Start will spawn a goroutine that reads file and Exits either on Context.Done or When processing is finished
func (proc *ExecCmd) Start(ctx context.Context) error {
	if proc.running {
		return failure.ErrAlreadyRunning
	}
	// Uncomment if u need to Processor to require an Ingress relationship
	if proc.needingress && proc.ingress == nil {
		return failure.ErrIngressRelationshipNeeded
	}
	proc.running = true
	// context will be used to spawn a Cancel func
	c, cancel := context.WithCancel(ctx)
	proc.cancel = cancel

	// EXEC ONCE OR ON INTERVAL
	if !proc.needingress {
		proc.running = true
		if proc.interval != 0 {
			intervalTicker := time.NewTicker(proc.interval)
			go func() {
				for {
					select {
					case <-intervalTicker.C:
						// Exec CMD
						payload, err := proc.Exec(nil)
						if err != nil {
							proc.publishFailure(err, payload)
						}
						if payload != nil {
							proc.egress <- payload
						}
					case <-c.Done():
						return
					}
				}
			}()
		} else {
			// EXEC CMD once
			payload, err := proc.Exec(nil)
			if err != nil {
				proc.publishFailure(err, payload)
			}
			if payload != nil {
				proc.egress <- payload
			}
		}

	} else {
		// IF INGRESS - EXEC DIRECTLY
		go func() {
			for {
				select {
				case payload := <-proc.ingress:
					// Exec CMD with payload
					newpay, err := proc.Exec(payload)
					if err != nil {
						proc.publishFailure(err, payload)
					}
					if newpay != nil {
						proc.egress <- newpay
					}
				case <-c.Done():
					return
				}
			}
		}()
	}

	return nil
}

func (proc *ExecCmd) publishFailure(err error, payload payload.Payload) {
	if proc.failures == nil {
		return
	}
	proc.failures <- failure.Failure{
		Err:       err,
		Payload:   payload,
		Processor: "ExecCmd",
	}
	proc.AddMetric("failures", "the number of failures that appeard during process", 1)
}

// Exec will execute the command
func (proc *ExecCmd) Exec(input payload.Payload) (payload.Payload, error) {
	// Build a Argument Slice
	command := proc.command
	for _, value := range proc.arguments {
		if strings.Contains(value, "payload") {
			// If value contains payload it will use it to insert the payloads Payload
			// IF payload is NIL, but is wanted, return ErrNoPayload
			if input == nil {
				return nil, ErrNoPayload
			}
			payFlag := strings.Replace(value, "payload", string(input.GetPayload()), -1)
			command += " " + payFlag
		} else {
			command += " " + value
		}
	}
	// Execute the command
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
	newpayload := &payload.BasePayload{
		Payload: stdout.Bytes(),
		Source:  fullCmd.String(),
	}
	proc.AddMetric("commands", "the number of commands that sucessfully has run", 1)
	return newpayload, nil
}

// IsRunning will return true or false based on if the processor is currently running
func (proc *ExecCmd) IsRunning() bool {
	return proc.running
}

// GetMetrics will return a bunch of generated metrics, or nil if there isn't any
func (proc *ExecCmd) GetMetrics() []*metric.Metric {
	return proc.GetAllMetrics()
}

// SetFailureChannel will configure the failure channel of the Processor
func (proc *ExecCmd) SetFailureChannel(fp relationships.FailurePipe) {
	proc.failures = fp
}

// Stop will stop the processing
func (proc *ExecCmd) Stop() {
	if !proc.running {
		return
	}
	proc.running = false
	proc.cancel()
}

// SetIngress will change the ingress of the processor, Restart is needed before applied changes
func (proc *ExecCmd) SetIngress(i relationships.PayloadChannel) {
	proc.ingress = i
	return
}

// GetEgress will return an Egress that is used to output the processed items
func (proc *ExecCmd) GetEgress() relationships.PayloadChannel {
	return proc.egress
}
