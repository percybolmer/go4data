package register

import (
	"errors"
	"testing"

	"github.com/percybolmer/workflow/handlers"
)

type testHandler struct {
	Name string
	handlers.Handler
}

func TestRegisterHandler(t *testing.T) {
	testf := &testHandler{
		Name: "hello",
	}
	// Reset Register
	HandlerRegister = make(map[string]handlers.Handler, 0)

	err := Register("printer", testf)
	if err != nil {
		t.Fatalf("Error should have been an HandlerAlreadyRegistered, not this : %v", err)
	}

	err = Register("printer", testf)
	if !errors.Is(err, ErrHandlerAlreadyRegistered) {
		t.Fatalf("Expected ErrHandlerAlreadyRegistered, not this: %v", err)
	}

}

func TestGetHandler(t *testing.T) {
	testf := &testHandler{}

	// Reset Register
	HandlerRegister = make(map[string]handlers.Handler, 0)
	_, err := GetHandler("printer")
	if !errors.Is(err, ErrHandlerNotRegistered) {
		t.Fatal(err)
	}

	err = Register("printer", testf)
	if err != nil {
		t.Fatalf("Error should have been an HandlerAlreadyRegistered, not this : %v", err)
	}

	act, err := GetHandler("printer")
	if err != nil {
		t.Fatal("error should have been nil when getting a Handler that is Registered")
	}
	if act == nil {
		t.Fatal("Handler should not be nil")
	}
}
