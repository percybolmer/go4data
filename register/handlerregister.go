package register

import (
	"errors"

	"github.com/percybolmer/go4data/handlers"
)

// HandlerRegister is used to keep track of all available Handlers that a processor can use
// To have a processor use a custom Handler It need to be Register with RegisterHandler
var HandlerRegister map[string]func() handlers.Handler

// ErrHandlerAlreadyRegistered is an error when trying to add Handlers that already is Registered
var ErrHandlerAlreadyRegistered = errors.New("an Handler with this name is already Registered")

// ErrHandlerNotRegistered is an error that is thrown when trying to find an Handler that does not exist
var ErrHandlerNotRegistered = errors.New("the Handler asked for is not Registered")

func init() {
	HandlerRegister = make(map[string]func() handlers.Handler)
}

// Register is used to register an Handler. If a Handler with that name already exists it will return an ErrHandlerAlreadyRegistered
func Register(name string, f func() handlers.Handler) error {
	if _, ok := HandlerRegister[name]; ok {
		return ErrHandlerAlreadyRegistered
	}
	HandlerRegister[name] = f
	return nil
}

// GetHandler is used to extract a Registered Handler, should return a NEW Copy of an Handler
func GetHandler(name string) (handlers.Handler, error) {
	if _, ok := HandlerRegister[name]; !ok {
		return nil, ErrHandlerNotRegistered
	}
	return HandlerRegister[name](), nil
}
