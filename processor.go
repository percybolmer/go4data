// Package workflow contains processors
// Processor is a interface used to describe what is needed to be Run inside an Workflow
// It will handle Stopping data flow and Inflow
// It will also make sure data is cleaned up beteween uses
package workflow

import "context"

// Processor is an interface that makes it possible to send data between and in diffreent items running
// An example processor is a FileReader that digests the content of a file and sends it along to the next Processor
type Processor interface {
	// Start will trigger the processor to ingest data
	Start(ctx context.Context) error
	// Stop will close the processor and cancel all items
	Stop()
	// IsRunning is a function that will return a True/False based on the processor running
	IsRunning() bool
}
