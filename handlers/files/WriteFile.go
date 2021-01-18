// Package files is generated by Handlergenerator tooling
// This Handler is used to print Payloads onto a file
package files

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/percybolmer/workflow/handlers"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
	"github.com/percybolmer/workflow/register"
)

// WriteFile is used to will print the stringified version of GetPayload into a file
type WriteFile struct {
	// Cfg is values needed to properly run the Handle func
	Cfg     *property.Configuration `json:"configs" yaml:"configs"`
	Name    string                  `json:"name" yaml:"handler_name"`
	path    string
	append  bool
	forward bool
	//pid and gid are set to change pid/gid fpr temp files
	pid int
	gid int
	subscriptionless bool

	errChan      chan error
	metrics      metric.Provider
	metricPrefix string
	// MetricPayloadOut is how many payloads the processor has outputted
	MetricPayloadOut string
	// MetricPayloadIn is how many payloads the processor has inputted
	MetricPayloadIn string
}

var (
	//ErrBadWriteData is thrown when the size written to file is not the same as the payload
	ErrBadWriteData error = errors.New("the size written to file does not match the payload")
	//ErrFileExists is when trying to write to Files that already exist, but Append is set to false
	ErrFileExists = errors.New("trying to write to file that already exists, but append is false")
)

func init() {
	register.Register("WriteFile", NewWriteFileHandler)
}

// NewWriteFileHandler generates a new WriteFile Handler
func NewWriteFileHandler() handlers.Handler {
	act := &WriteFile{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:    "WriteFile",
		errChan: make(chan error, 1000),
		metrics: metric.NewPrometheusProvider(),
	}
	act.Cfg.AddProperty("path", "the path on where to write files", true)
	act.Cfg.AddProperty("append", "if set to true it will append to files instead of overwriting collisions", true)
	act.Cfg.AddProperty("forward", "if set to true it will output the payload after writing it", true)
	act.Cfg.AddProperty("pid", "Set the PID that written files will have", true)
	act.Cfg.AddProperty("gid", "Set the GID that written files will have", true)
	return act
}

// GetHandlerName is used to retrun a unqiue string name
func (a *WriteFile) GetHandlerName() string {
	return a.Name
}

// Handle is used to write files to disc
func (a *WriteFile) Handle(ctx context.Context, input payload.Payload, topics ...string) error {
	a.metrics.IncrementMetric(a.MetricPayloadIn, 1)
	finfo, err := os.Stat(a.path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	if finfo != nil && finfo.IsDir() {
		// Write is to a folder, No need for error, but lets create a random name with tmpfile
		file, err := ioutil.TempFile(a.path, "WriteFile_")
		if err != nil {
			return err
		}
		// set gid/pid
		err = os.Chown(file.Name(), a.pid, a.gid)
		if err != nil {
			return err	
		}
		err = write(file, input.GetPayload())
		if err != nil {
			return err
		}
	} else {
		if finfo != nil && !a.append {
			// We dont want to write to files that exists if append is false
			return ErrFileExists
		}
		file, err := os.OpenFile(a.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return err
		}
		_, err = fmt.Fprintf(file, "\n%s", string(input.GetPayload()))
		if err != nil {
			return err
		}
	}

	if a.forward {
		errs := pubsub.PublishTopics(topics, input)
		for _, err := range errs {
			a.errChan <- err
		}
		a.metrics.IncrementMetric(a.MetricPayloadOut, 1)
	}
	return nil

}

// write is a function that takes a file, close it and writes to it.. in reverse order ofcourse:)
func write(file *os.File, data []byte) error {
	defer file.Close()
	n, err := file.Write(data)
	if err != nil {
		return err
	}
	if n != len(data) {
		return ErrBadWriteData
	}
	return nil
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *WriteFile) ValidateConfiguration() (bool, []string) {
	// Check if Cfgs are there as needed
	missing := make([]string, 0)

	pathProp := a.Cfg.GetProperty("path")
	appendProp := a.Cfg.GetProperty("append")
	forwardProp := a.Cfg.GetProperty("forward")
	pidProp = a.Cfg.GetProperty("pid")
	gidProp = a.Cfg.GetProperty("gid") 
	
	if pidPropr != nil {
		pid, err := pidProp.Int()
		if err != nil {
			return false, append(missing, err.Error())	
		}
		a.pid = pid
	}
	if gidProp != nil {
		gid, err := gidProp.Int()
		if err != nil {
			return false, append(missing, err.Error())	
		}
		a.gid = gid
	}
	path := pathProp.String()
	app, err := appendProp.Bool()
	if err != nil {
		return false, append(missing, err.Error())
	}

	forward, err := forwardProp.Bool()
	if err != nil {
		return false, append(missing, err.Error())
	}

	a.path = path
	a.append = app
	a.forward = forward
	return true, nil
}

// GetConfiguration will return the CFG for the Handler
func (a *WriteFile) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return true/false if the Handler is genereating payloads itself
func (a *WriteFile) Subscriptionless() bool {
	return a.subscriptionless
}

// GetErrorChannel will return a channel that the Handler can output eventual errors onto
func (a *WriteFile) GetErrorChannel() chan error {
	return a.errChan
}

// SetMetricProvider is used to change what metrics provider is used by the handler
func (a *WriteFile) SetMetricProvider(p metric.Provider, prefix string) error {
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
