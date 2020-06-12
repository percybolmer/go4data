package properties

import (
	"testing"
)

func TestAddingRemovingProperties(t *testing.T) {
	p := NewPropertyMap()

	dontPanic := p.GetProperty("non")
	if dontPanic != nil {
		t.Fatal("Something is wrong, should be nil")
	}

	p.SetProperty("someConfig", "123123")

	something := p.GetProperty("someConfig")

	if something == nil {
		t.Fatal("Should have found a Property")
	}

	p.RemoveProperty("someConfig")

	s2 := p.GetProperty("someConfig")
	if s2 != nil {
		t.Fatal("Shouldnt have found any config after removal")
	}
	t.Logf(something.Value.(string))
}

func TestValidation(t *testing.T) {
	p := NewPropertyMap()

	p.SetProperty("integer", 10)

	p.SetProperty("string", "HelloWorld")

	valid, _ := p.ValidateProperties()
	if !valid {
		t.Fatalf("Should have all the needed Properties")
	}

	p.RemoveProperty("string")

	valid, missing := p.ValidateProperties()
	if valid {
		t.Fatalf("Should have been invalid, this is the result: %v", missing)
	}
}
func TestReflection(t *testing.T) {
	p := NewPropertyMap()

	p.SetProperty("integer", 10)

	p.SetProperty("string", "HelloWorld")

	intProp := p.GetProperty("integer")
	strProp := p.GetProperty("string")

	_, _ = intProp.Int()
	_ = strProp.String()

	intAsString := intProp.String()

	t.Log(intAsString)

}
