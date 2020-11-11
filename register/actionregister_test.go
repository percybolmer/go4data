package register

import (
	"errors"
	"testing"

	"github.com/perbol/workflow/actions"
	"github.com/perbol/workflow/actions/terminal"
)

func TestRegisterAction(t *testing.T) {
	testf := &terminal.StdoutAction{}

	// Reset Register
	ActionRegister = make(map[string]actions.Action, 0)

	err := Register("printer", testf)
	if err != nil {
		t.Fatalf("Error should have been an ActionAlreadyRegisterd, not this : %v", err)
	}

	err = Register("printer", testf)
	if !errors.Is(err, ErrActionAlreadyRegisterd) {
		t.Fatalf("Expected ErrActionAlreadyRegisterd, not this: %v", err)
	}

}

func TestGetAction(t *testing.T) {
	testf := &terminal.StdoutAction{}

	// Reset Register
	ActionRegister = make(map[string]actions.Action, 0)
	_, err := GetAction("printer")
	if !errors.Is(err, ErrActionNotRegisterd) {
		t.Fatal(err)
	}

	err = Register("printer", testf)
	if err != nil {
		t.Fatalf("Error should have been an ActionAlreadyRegisterd, not this : %v", err)
	}

	act, err := GetAction("printer")
	if err != nil {
		t.Fatal("error should have been nil when getting a action that is registerd")
	}
	if act == nil {
		t.Fatal("Action should not be nil")
	}
}
