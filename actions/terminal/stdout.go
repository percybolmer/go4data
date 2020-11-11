// Package terminal contains actions related to STDOUT
package terminal

import (
	"fmt"

	"github.com/perbol/workflow/payload"
	"github.com/perbol/workflow/property"
	"github.com/perbol/workflow/register"
)

// StdoutAction is used to print payloads to stdout, great for debugging
type StdoutAction struct {
	// Cfg is values needed to properly run the Handler
	Cfg  *property.Configuration `json:"configs" yaml:"configs"`
	Name string                  `json:"name" yaml:"name"`
	// forward will forward payloads printed if true
	forward bool
	// Metric is a metric container to publish Metrics from an Action
	// subscriptionless is used to say if the action is subscriptionless
	subscriptionless bool
}

func init() {
	register.Register("Stdout", NewStdoutAction())
}

// NewStdoutAction generates a new Stdout action
func NewStdoutAction() *StdoutAction {
	act := &StdoutAction{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:    "Stdout",
		forward: true,
	}
	act.Cfg.AddProperty("forward", "Set to true if payloads should be forwarded", false)
	return act
}

// GetActionName is used to retrun a unqiue string name
func (a *StdoutAction) GetActionName() string {
	return a.Name
}

// Handle is used to print payloads to stdout
func (a *StdoutAction) Handle(data payload.Payload) ([]payload.Payload, error) {
	fmt.Println(string(data.GetPayload()))
	output := make([]payload.Payload, 0)
	if a.forward {
		output = append(output, data)
		return output, nil
	}
	return nil, nil
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *StdoutAction) ValidateConfiguration() (bool, []string) {
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

// GetConfiguration will return the CFG for the action
func (a *StdoutAction) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return false since this action needs publishers
func (a *StdoutAction) Subscriptionless() bool {
	return a.subscriptionless
}
