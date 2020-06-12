// Package failure contains all that is related to Failure struct that is used by Processors to report errors
package failure

import (
	"errors"
	"fmt"
	"github.com/percybolmer/workflow/payload"
)
var (
	//ErrProcessorAlreadyExists is when somebody runs RegisterProcessor and gives a name that is already taken
	ErrProcessorAlreadyExists error = errors.New("a processor named that does already exists")
	//ErrAlreadyRunning is when trying to start an Processor that is already running
	ErrAlreadyRunning = errors.New("this processor does not support MultiRun")
	//ErrIngressRelationshipNeeded is when a processor isn't getting the needed ingress
	ErrIngressRelationshipNeeded = errors.New("the processor needs an ingress to properly run")
)
// Failure is the Workflows Custom error handeling struct
// It contains Error and some meta data about what Processor that triggerd the error
type Failure struct {
	// Err is the error that occured
	Err error `json:"error"`
	// Payload is the payload that was being processed when a Failure occured
	Payload payload.Payload `json:"payload"`
	// Processor is the Name of the Processor, It will be extracted from the Name property
	Processor string `json:"processor"`
}

// PrintFailure is a FailureHandler
func PrintFailure(f Failure) {
	fmt.Printf("%s cast by %s with payload %s", f.Err, f.Processor, f.Payload.GetPayload())
}
