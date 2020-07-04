// Package processors contains processors
// Processor is a interface used to describe what is needed to be Run inside an Workflow
// It will handle Stopping data flow and Inflow
// It will also make sure data is cleaned up beteween uses
package processors

import (
	"context"

	"github.com/percybolmer/workflow/relationships"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/properties"
)

// Processor is an interface that makes it possible to send data between and in diffreent items running
// An example processor is a FileReader that digests the content of a file and sends it along to the next Processor
type Processor interface {
	// GetName should return a unique name for a processor that can be used whenever the Processor needs to be referenced
	GetName() string
	// GetDescription is used to return a description about the Processor
	GetDescription() string
	// Initialize is responsible to make sure the Processor has everything it needs to run properly and setup needed things before Start
	Initialize() error
	// Start will trigger the processor to ingest data,
	// Remember that LOCKING is not allowed, this wont work correctly at this point, Always spawn processing in a goroutine
	Start(ctx context.Context) error
	// Stop will close the processor and cancel all items
	Stop()
	// IsRunning is a function that will return a True/False based on the processor running
	// Note some processors are allowed to be run multiple times without Gracefully shutting down
	// Those processors are referd as MultiRun Processors. Its up to the developer to make sure IsRunning is returning the right
	// bool based on if its a MultiRun or Not
	IsRunning() bool
	// SetIngress is used to set an ingress Channel to the Processor, can be Nil if the Processor doesnt require a Ingress
	SetIngress(i relationships.PayloadChannel)
	// GetEgress is used to get the Success relationship from a processor
	GetEgress() relationships.PayloadChannel
	// SetFailureChannel is used by an Processor to assign a FailureChannel that can be used when throwing errors
	SetFailureChannel(fp relationships.FailurePipe)
	// Processors should be Part of the PropertyContainer interface
	properties.PropertyContainer
	// MetricProvider is a interface that forces processors to handle metrics
	metric.MetricProvider
}
