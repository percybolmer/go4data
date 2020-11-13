package register

import (
	"errors"

	"github.com/percybolmer/workflow/handlers"
)

// HandlerRegister is used to keep track of all available Handlers that a processor can use
// To have a processor use a custom Handler It need to be Register with RegisterHandler
var HandlerRegister map[string]handlers.Handler

// ErrHandlerAlreadyRegisterd is an error when trying to add Handlers that already is registerd
var ErrHandlerAlreadyRegisterd = errors.New("an Handler with this name is already registerd")

// ErrHandlerNotRegisterd is an error that is thrown when trying to find an Handler that does not exist
var ErrHandlerNotRegisterd = errors.New("the Handler asked for is not registerd")

func init() {
	HandlerRegister = make(map[string]handlers.Handler, 0)
}

// Register is used to register an Handler. If a Handler with that name already exists it will return an ErrHandlerAlreadyRegisterd
func Register(name string, f handlers.Handler) error {
	if _, ok := HandlerRegister[name]; ok {
		return ErrHandlerAlreadyRegisterd
	}
	HandlerRegister[name] = f
	return nil
}

// GetHandler is used to extract a registerd Handler, should return a NEW Copy of an Handler
func GetHandler(name string) (handlers.Handler, error) {
	if _, ok := HandlerRegister[name]; !ok {
		return nil, ErrHandlerNotRegisterd
	}
	// @TODO FIX so it returns a copy instead
	return HandlerRegister[name], nil
}
