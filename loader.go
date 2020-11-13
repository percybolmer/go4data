package workflow

import (
	"context"
	"errors"
	"io/ioutil"
	"time"

	"github.com/perbol/workflow/property"
	"github.com/perbol/workflow/register"
	"gopkg.in/yaml.v3"
)

// Save takes care of storing a yaml config of data
func Save(path string, data interface{}) error {
	output, err := yaml.Marshal(data)
	if err != nil {
		return err
	}
	return ioutil.WriteFile(path, output, 0644)
}

// Load will return a slice of processors loaded from a config
func Load(path string) ([]*Processor, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var procs []*LoaderProccessor
	err = yaml.Unmarshal(data, &procs)
	if err != nil {
		return nil, err
	}
	var realproc []*Processor
	for _, proc := range procs {
		rp, err := proc.ConvertToProcessor()
		if err != nil {
			return nil, err
		}
		realproc = append(realproc, rp)
	}
	return realproc, nil
}

// LoaderProccessor is used to load/save processors
type LoaderProccessor struct {
	// ID is a unique identifier for each processor,
	ID uint `json:"id" yaml:"id"`
	// Name is a user configured Name for a processor that can be used relatd to an Processor easier than an ID, cannot be duplicate tho
	// It will be changed to be duplicates later, but for now PrometheusMetrics crashes.
	Name string `json:"name" yaml:"name"`
	// Running is a boolean indicator if the processor is currently Running
	Running bool `json:"running" yaml:"running"`
	// Topics is the Topics to publish payload onto
	Topics []string `json:"topics" yaml:"topics"`
	// Subscriptions is the Topics to subscribe to
	Subscriptions []string `json:"subscriptions" yaml:"subscriptions"`
	// ExecutionInterval is how often to execute the interval, this only
	// applies to Selfpublishing Handlers
	ExecutionInterval time.Duration `json:"executioninterval" yaml:"executioninterval"`
	// QueueSize is a integer of how many payloads are accepted on the Output channels to Subscribers
	QueueSize int `json:"queuesize" yaml:"queuesize"`
	// LoaderHandler is a Handler that can be loaded/saved
	Handler LoaderHandler `json:"loaderhandler" yaml:"handler"`
}

// LoaderHandler is a Handler thats easier to save/load
type LoaderHandler struct {
	Cfg  *property.Configuration `json:"configs" yaml:"configs"`
	Name string                  `json:"handler" yaml:"handler_name"`
}

// ConvertToProcessor is used to convert a Loader back into a Processor thats
// Runnable.
func (la *LoaderProccessor) ConvertToProcessor() (*Processor, error) {
	// Load all Processor stuff, Topics etc etc
	p := NewProcessor(la.Name, la.Topics...)
	p.SetExecutionInterval(la.ExecutionInterval)
	p.QueueSize = la.QueueSize
	// Get NewHandler from Register
	handler, err := register.GetHandler(la.Handler.Name)
	if err != nil {
		return nil, err
	}
	p.Handler = handler

	cfg := p.Handler.GetConfiguration()
	// Apply Configs
	for _, loadcfg := range la.Handler.Cfg.Properties {
		err := cfg.SetProperty(loadcfg.Name, loadcfg.Value)
		if err != nil {
			return nil, err
		}
	}

	worked, errs := p.Handler.ValidateConfiguration()
	if !worked && errs != nil {
		return nil, errors.New(errs[0])
	}
	// Resubscribe to Subscriptions
	err = p.Subscribe(la.Subscriptions...)
	if err != nil {
		return nil, err
	}

	// Check if LA.Running is true, then start?
	if la.Running {
		err = p.Start(context.Background())
		if err != nil {
			return nil, err
		}
	}
	// What FailureHandler has been applied? Does FH need a GetName aswelL?
	// ANd maybe a RegisterFailureHandler?
	return p, nil
}
