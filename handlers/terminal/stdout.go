// Package terminal contains Handlers related to STDOUT
package terminal

import (
	"fmt"

	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/register"
)

// StdoutHandler is used to print payloads to stdout, great for debugging
type StdoutHandler struct {
	// Cfg is values needed to properly run the Handler
	Cfg  *property.Configuration `json:"configs" yaml:"configs"`
	Name string                  `json:"handler_name" yaml:"handler_name"`
	// forward will forward payloads printed if true
	forward bool
	// Metric is a metric container to publish Metrics from an Handler
	// subscriptionless is used to say if the Handler is subscriptionless
	subscriptionless bool
}

func init() {
	register.Register("Stdout", NewStdoutHandler())
}

// NewStdoutHandler generates a new Stdout Handler
func NewStdoutHandler() *StdoutHandler {
	act := &StdoutHandler{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:    "Stdout",
		forward: true,
	}
	act.Cfg.AddProperty("forward", "Set to true if payloads should be forwarded", false)
	return act
}

// GetHandlerName is used to retrun a unqiue string name
func (a *StdoutHandler) GetHandlerName() string {
	return a.Name
}

// Handle is used to print payloads to stdout
func (a *StdoutHandler) Handle(data payload.Payload) ([]payload.Payload, error) {
	fmt.Println(string(data.GetPayload()))
	output := make([]payload.Payload, 0)
	if a.forward {
		output = append(output, data)
		return output, nil
	}
	return nil, nil
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *StdoutHandler) ValidateConfiguration() (bool, []string) {
	// Check if Proxy forward is true

	valid, miss := a.Cfg.ValidateProperties()
	if !valid {
		return valid, miss
	}
	forwardProp := a.Cfg.GetProperty("forward")

	if forwardProp.Value == nil {
		return true, nil
	}
	forward, err := forwardProp.Bool()
	if err != nil {
		return false, []string{err.Error()}
	}
	a.forward = forward
	return true, nil
}

// GetConfiguration will return the CFG for the Handler
func (a *StdoutHandler) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return false since this Handler needs publishers
func (a *StdoutHandler) Subscriptionless() bool {
	return a.subscriptionless
}
