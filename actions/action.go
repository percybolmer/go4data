package actions

import (
	"github.com/perbol/workflow/payload"
	"github.com/perbol/workflow/property"
)

// Action is a alias for a function that accepts a payload and outputs a payload
type Action interface {
	// Handle is the function that will be performed on the incomming Payloads
	Handle(payload payload.Payload) ([]payload.Payload, error)
	// ValidateConfiguration is used to make sure everything that is needed by the action is set
	ValidateConfiguration() (bool, []string)
	// GetConfiguration will return the configuration slice
	GetConfiguration() *property.Configuration
	//GetActionName will return the name used to reference a action
	GetActionName() string
	// Subscriptionless should return true/false wether the action itself is a self generating action
	// This is true for Actions like ListDirectory etc, which does not need
	// any inputs to function
	// Setting Subscriptionless to true will actually disable the processor needing subscriptions to work
	Subscriptionless() bool
	// @TODO
	// GetMetric() So that each action can add its own custom metrics aswell
}
