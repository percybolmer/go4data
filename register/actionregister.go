package register

import (
	"errors"

	"github.com/perbol/workflow/actions"
)

// ActionRegister is used to keep track of all available actions that a processor can use
// To have a processor use a custom Action It need to be Register with RegisterAction
var ActionRegister map[string]actions.Action

// ErrActionAlreadyRegisterd is an error when trying to add actions that already is registerd
var ErrActionAlreadyRegisterd = errors.New("an action with this name is already registerd")

// ErrActionNotRegisterd is an error that is thrown when trying to find an action that does not exist
var ErrActionNotRegisterd = errors.New("the action asked for is not registerd")

func init() {
	ActionRegister = make(map[string]actions.Action, 0)
}

// Register is used to register an action. If a action with that name already exists it will return an ErrActionAlreadyRegisterd
func Register(name string, f actions.Action) error {
	if _, ok := ActionRegister[name]; ok {
		return ErrActionAlreadyRegisterd
	}
	ActionRegister[name] = f
	return nil
}

// GetAction is used to extract a registerd action, should return a NEW Copy of an action
func GetAction(name string) (actions.Action, error) {
	if _, ok := ActionRegister[name]; !ok {
		return nil, ErrActionNotRegisterd
	}
	// @TODO FIX so it returns a copy instead
	return ActionRegister[name], nil
}
