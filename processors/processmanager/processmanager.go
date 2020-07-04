package processmanager

import (
	"errors"

	"github.com/percybolmer/workflow/processors"
)

var (
	// ErrProcessorAlreadyExists is used when trying to register a processor that is already registerd
	ErrProcessorAlreadyExists = errors.New("processor already exists")
	// ErrProcessorNotRegistered is thrown when trying to find a processor that has not yet been registerd
	ErrProcessorNotRegistered = errors.New("processor is not registerd")
	// ErrProcessorDoesNotFulfillInterface is when the processor that is trying to register is not an actualy Processor
	ErrProcessorDoesNotFulfillInterface = errors.New("processor does not fulfill interface")
)

// ProcessorManager is used to keep a global map of all processors currently imported
var ProcessorManager map[string]func() interface{}

func init() {
	ProcessorManager = make(map[string]func() interface{}, 0)
}

// RegisterProcessor is used to add a Processor to the Global ProcessorMap
// It will return an error if the name provided is already registerd
func RegisterProcessor(name string, f func() interface{}) error {
	if _, ok := ProcessorManager[name]; ok {
		return ErrProcessorAlreadyExists
	}
	ProcessorManager[name] = f
	return nil
}

// GetProcessor is used to generate a new Processor of the requested type
func GetProcessor(name string) (processors.Processor, error) {
	if _, ok := ProcessorManager[name]; !ok {
		return nil, ErrProcessorNotRegistered
	}
	original, ok := ProcessorManager[name]().(processors.Processor)
	if !ok {
		return nil, ErrProcessorDoesNotFulfillInterface
	}
	return original, nil
}

// GetAllProcessors is used to generate all kind of processors and return them as a slice
func GetAllProcessors() []processors.Processor {
	var result []processors.Processor
	for _, f := range ProcessorManager {
		p := f().(processors.Processor)
		result = append(result, p)
	}
	return result
}
