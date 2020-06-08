// Package workflow contains processors
// Processor is a interface used to describe what is needed to be Run inside an Workflow
// It will handle Stopping data flow and Inflow
// It will also make sure data is cleaned up beteween uses
package workflow

import (
	"context"
	"github.com/percybolmer/workflow/properties"
)
// Relationship is another word for an PayloadChannel, used to commuicate events between Processors
type Relationship chan Payload

// FailurePipe is used to send Failures from Processors onto, how they are handled is up the Processor or Workflow, or the user can make their own
type FailurePipe chan Failure

// Processor is an interface that makes it possible to send data between and in diffreent items running
// An example processor is a FileReader that digests the content of a file and sends it along to the next Processor
type Processor interface {
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
	SetIngress(i Relationship)
	// GetEgress is used to get the Success relationship from a processor
	GetEgress() Relationship
	// SetFailureChannel is used by an Processor to assign a FailureChannel that can be used when throwing errors
	SetFailureChannel(fp FailurePipe)
	// Processors should be Part of the PropertyContainer interface
	properties.PropertyContainer
}
