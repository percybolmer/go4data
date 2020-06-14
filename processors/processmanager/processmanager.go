package processmanager

import (
	"errors"
	"github.com/percybolmer/workflow/processors"
)

var (
	ErrProcessorAlreadyExists = errors.New("processor already exists")
	ErrProcessorNotRegistered = errors.New("processor is not registerd")
	ErrProcessorDoesNotFulfillInterface = errors.New("processor does not fulfill interface")
)
var ProcessorManager map[string]func() interface{}


func init() {
	ProcessorManager = make(map[string]func() interface{},0)
}

func RegisterProcessor(name string,f func() interface{}) error{
	if _, ok := ProcessorManager[name]; ok {
		return ErrProcessorAlreadyExists
	}
	ProcessorManager[name] = f
	return nil
}

func GetProcessor(name string) (processors.Processor,error){
	if _ , ok := ProcessorManager[name]; !ok {
		return nil, ErrProcessorNotRegistered
	}
	original, ok := ProcessorManager[name]().(processors.Processor)
	if !ok {
		return nil, ErrProcessorDoesNotFulfillInterface
	}
	return  original, nil
}