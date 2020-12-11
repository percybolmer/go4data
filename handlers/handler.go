package handlers

import (
	"context"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
)

// Handler is a interface that allows users to create structs with certain functions attached that can be used inside a processor
// to handle payloads between them.
type Handler interface {
	// Handle is the function that will be performed on the incomming Payloads
	// topics is the topics to push output onto
	Handle(ctx context.Context, payload payload.Payload, topics ...string) error
	// ValidateConfiguration is used to make sure everything that is needed by the handler is set
	ValidateConfiguration() (bool, []string)
	// GetConfiguration will return the configuration slice
	GetConfiguration() *property.Configuration
	//GetHandlerName will return the name used to reference a handler
	GetHandlerName() string
	// Subscriptionless should return true/false wether the handler itself is a self generating handler
	// This is true for handlers like ListDirectory etc, which does not need
	// any inputs to function
	// Setting Subscriptionless to true will actually disable the processor needing subscriptions to work and rely on the Handler to publish itself
	Subscriptionless() bool
	// SetMetricProvider is a function that is used to set a metric provider to a handler.
	// This should be used if you want to output metrics from your handler. Bydefault we use prometheusprovider as a metric provider.
	// A unique prefix also has to be attached since we dont want handler metrics to collide. Bydefault most Processors use Processor.Name + Processor.ID
	SetMetricProvider(p metric.Provider, prefix string) error
	// GetErrorChannel() chan error
	GetErrorChannel() chan error
}
