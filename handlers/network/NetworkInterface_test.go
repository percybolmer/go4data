package network

import (
    "testing"
    "github.com/percybolmer/workflow/property"
	"errors"
)

func TestNetworkInterfaceHandle(t *testing.T) {

}

func TestNetworkInterfaceValidateConfiguration(t *testing.T) {
	type testCase struct {
			Name        string
			Cfgs        map[string]interface{}
			IsValid     bool
			ExpectedErr error
		}

		testCases := []testCase{
			{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatExists": 1}, ExpectedErr: property.ErrWrongPropertyType},
			{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
			{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
		}

		for _, tc := range testCases {
			rfg := NewNetworkInterfaceHandler()

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