package processors

import "fmt"

// Failure is the Workflows Custom error handeling struct
// It contains Error and some meta data about what Processor that triggerd the error
type Failure struct {
	// Err is the error that occured
	Err error `json:"error"`
	// Payload is the payload that was being processed when a Failure occured
	Payload Payload `json:"payload"`
	// Processor is the Name of the Processor, It will be extracted from the Name property
	Processor string `json:"processor"`
}

// PrintFailure is a FailureHandler
func PrintFailure(f Failure) {
	fmt.Printf("%s cast by %s with payload %s", f.Err, f.Processor, f.Payload.GetPayload())
}
