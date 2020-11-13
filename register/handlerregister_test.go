package register

import (
	"errors"
	"testing"

	"github.com/perbol/workflow/handlers"
	"github.com/perbol/workflow/handlers/terminal"
)

func TestRegisterHandler(t *testing.T) {
	testf := &terminal.StdoutHandler{}

	// Reset Register
	HandlerRegister = make(map[string]handlers.Handler, 0)

	err := Register("printer", testf)
	if err != nil {
		t.Fatalf("Error should have been an HandlerAlreadyRegisterd, not this : %v", err)
	}

	err = Register("printer", testf)
	if !errors.Is(err, ErrHandlerAlreadyRegisterd) {
		t.Fatalf("Expected ErrHandlerAlreadyRegisterd, not this: %v", err)
	}

}

func TestGetHandler(t *testing.T) {
	testf := &terminal.StdoutHandler{}

	// Reset Register
	HandlerRegister = make(map[string]handlers.Handler, 0)
	_, err := GetHandler("printer")
	if !errors.Is(err, ErrHandlerNotRegisterd) {
		t.Fatal(err)
	}

	err = Register("printer", testf)
	if err != nil {
		t.Fatalf("Error should have been an HandlerAlreadyRegisterd, not this : %v", err)
	}

	act, err := GetHandler("printer")
	if err != nil {
		t.Fatal("error should have been nil when getting a Handler that is registerd")
	}
	if act == nil {
		t.Fatal("Handler should not be nil")
	}
}
