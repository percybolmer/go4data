package register

import (
	"errors"
	"testing"

	"github.com/percybolmer/go4data/handlers"
	"github.com/percybolmer/go4data/property"
)

type testHandler struct {
	Name string
	handlers.Handler
	cfg *property.Configuration
}

func NewTestHandler() handlers.Handler {
	return &testHandler{
		cfg: property.NewConfiguration(),
	}
}
func (th *testHandler) GetConfiguration() *property.Configuration {
	if th.cfg == nil {
		th.cfg = property.NewConfiguration()
	}
	return th.cfg
}

func TestRegisterHandler(t *testing.T) {

	// Reset Register
	HandlerRegister = make(map[string]func() handlers.Handler)

	err := Register("printer", NewTestHandler)
	if err != nil {
		t.Fatalf("Error should have been an HandlerAlreadyRegistered, not this : %v", err)
	}

	err = Register("printer", NewTestHandler)
	if !errors.Is(err, ErrHandlerAlreadyRegistered) {
		t.Fatalf("Expected ErrHandlerAlreadyRegistered, not this: %v", err)
	}

}

func TestGetHandler(t *testing.T) {
	// Reset Register
	HandlerRegister = make(map[string]func() handlers.Handler)
	_, err := GetHandler("printer")
	if !errors.Is(err, ErrHandlerNotRegistered) {
		t.Fatal(err)
	}

	err = Register("printer", NewTestHandler)
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

func TestGetHandlerIsCopy(t *testing.T) {

	// We need to make sure the returned handler is a copy
	err := Register("copyprinter", NewTestHandler)
	if err != nil {
		t.Fatal("Should have registred just fine")
	}
	handler, err := GetHandler("copyprinter")
	if err != nil {
		t.Fatal("Should have found copy printer")
	}
	secondHandler, err := GetHandler("copyprinter")
	if err != nil {
		t.Fatal("Should have gotten a second printer just fine")
	}

	cfg := handler.GetConfiguration()
	if cfg == nil {
		t.Fatal("Config should not be nil")
	}

	cfg2 := secondHandler.GetConfiguration()
	if cfg2 == nil {
		t.Fatal("Should not be nil")
	}

	// Now cfg should not be the same
	cfg.AddProperty("test", "testing", false)
	err = cfg.SetProperty("test", "hello")
	if err != nil {
		t.Fatal(err)
	}

	testProp := cfg2.GetProperty("test")
	if testProp != nil {
		t.Fatal("Cfg2 has the testProp")
	}
}
