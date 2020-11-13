package handlers

import (
	"github.com/perbol/workflow/payload"
	"github.com/perbol/workflow/property"
)

// Handler is a interface that allows users to create structs with certain functions attached that can be used inside a processor
// to handle payloads between them.
type Handler interface {
	// Handle is the function that will be performed on the incomming Payloads
	Handle(payload payload.Payload) ([]payload.Payload, error)
	// ValidateConfiguration is used to make sure everything that is needed by the handler is set
	ValidateConfiguration() (bool, []string)
	// GetConfiguration will return the configuration slice
	GetConfiguration() *property.Configuration
	//GetHandlerName will return the name used to reference a handler
	GetHandlerName() string
	// Subscriptionless should return true/false wether the handler itself is a self generating handler
	// This is true for handlers like ListDirectory etc, which does not need
	// any inputs to function
	// Setting Subscriptionless to true will actually disable the processor needing subscriptions to work
	Subscriptionless() bool
	// @TODO
	// GetMetric() So that each handler can add its own custom metrics aswell
}
