package terminal

import (
	"errors"
	"testing"

	"github.com/percybolmer/workflow/property"
)

func TestExecCMDHandle(t *testing.T) {
	rfg := NewExecCMDHandler()

	rfg.Cfg.SetProperty("command", "echo")
	//rfg.Cfg.SetProperty("arguments", map[string]interface{}{"hello": "world"})
	rfg.Cfg.SetProperty("arguments", []string{"Hello", "World!"})
	pay, err := rfg.Exec(nil)
	if !errors.Is(err, ErrEmptyCommand) {
		t.Fatal(err)
	}

	rfg.ValidateConfiguration()
	pay, err = rfg.Exec(nil)

	if string(pay.GetPayload()) != "Hello World!\n" {
		t.Log(pay.GetPayload())
		t.Fatalf("Wrong payload found: %s", string(pay.GetPayload()))
	}
	// test with Flags
	rfg.Cfg.SetProperty("arguments", []string{"-n", "Hello", "World!"})
	rfg.ValidateConfiguration()
	pay, _ = rfg.Exec(nil)

	if string(pay.GetPayload()) != "Hello World!" {
		t.Log(pay.GetPayload())
		t.Log(pay.GetSource())
		t.Fatalf("Wrong payload with Flags found: %s", string(pay.GetPayload()))

	}
}

func TestExecCMDValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"arguments": 1}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewExecCMDHandler()

		for name, prop := range tc.Cfgs {
			err := rfg.Cfg.SetProperty(name, prop)
			if !errors.Is(err, tc.ExpectedErr) {
				if err != nil && tc.ExpectedErr != nil {
					t.Fatalf("Expected: %s, but found: %s", tc.ExpectedErr, err.Error())
				}

			}
		}

		valid, _ := rfg.ValidateConfiguration()
		if !tc.IsValid && valid {
			t.Fatal("Missmatch between Valid and tc.IsValid")
		}
	}
}
