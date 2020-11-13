package files

import (
	"errors"
	"testing"

	"github.com/perbol/workflow/payload"
	"github.com/perbol/workflow/property"
)

func TestWriteFileHandle(t *testing.T) {
	type testCase struct {
		name        string
		cfgs        map[string]interface{}
		data        []byte
		expectedErr error
	}

	testcases := []testCase{
		{
			name:        "dontappendexisting",
			cfgs:        map[string]interface{}{"path": "testing/WriteFile/dontoverwrite.txt", "append": false, "forward": false},
			data:        []byte(`dont write this`),
			expectedErr: ErrFileExists,
		}, {
			name:        "append",
			cfgs:        map[string]interface{}{"path": "testing/WriteFile/appendme.txt", "append": true, "forward": false},
			data:        []byte(`im appended`),
			expectedErr: nil,
		}, {
			name:        "create",
			cfgs:        map[string]interface{}{"path": "testing/WriteFile", "append": false, "forward": false},
			data:        []byte(`im created`),
			expectedErr: nil,
		},
	}

	for _, tc := range testcases {
		act := NewWriteFileHandler()

		for name, prop := range tc.cfgs {
			err := act.Cfg.SetProperty(name, prop)
			if !errors.Is(err, tc.expectedErr) {
				if err != nil && tc.expectedErr != nil {
					t.Fatalf("%s: Expected: %s, but found: %s", tc.name, tc.expectedErr, err.Error())
				}

			}
		}

		act.ValidateConfiguration()

		pay := payload.BasePayload{
			Source:  "test",
			Payload: tc.data,
		}
		output, err := act.Handle(pay)

		if !errors.Is(err, tc.expectedErr) {
			t.Fatalf("%s: %s : %s", tc.name, err, tc.expectedErr)
		}

		if act.append {
			_, err := act.Handle(pay)
			if !errors.Is(err, tc.expectedErr) {
				t.Fatalf("%s: %s : %s", tc.name, err, tc.expectedErr)
			}
		}

		if act.forward {
			if len(output) != 1 {
				t.Fatal("Act didnt forward payload")
			}
		}

	}
}

func TestWriteFileValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"path": 1}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewWriteFileHandler()

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
