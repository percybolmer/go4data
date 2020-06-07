package workflow

// Failure is the Workflows Custom error handeling struct
// It contains Error and some meta data about what Processor that triggerd the error
type Failure struct {
	Err error
}
