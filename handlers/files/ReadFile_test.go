package files

import (
	"errors"
	"os"
	"testing"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
)

func TestReadFileHandle(t *testing.T) {
	rfg := NewReadFileHandler()

	cfg := rfg.GetConfiguration()
	err := cfg.SetProperty("remove_after", false)
	if err != nil {
		t.Fatal(err)
	}
	rfg.SetMetricProvider(metric.NewPrometheusProvider(), "testreadfile")

	// Bad payload should return error
	// Real payload should return 1 length in topic
	goodpayload := payload.NewBasePayload([]byte("testing/coolfile.txt"), "test", nil)
	badpayload := payload.NewBasePayload([]byte("testing/nosuchfile.txt"), "test", nil)

	err = rfg.Handle(nil, badpayload, "test")

	if !os.IsNotExist(err) {
		t.Fatal(err)
	}
	err = rfg.Handle(nil, goodpayload, "test")
	if err != nil {
		t.Fatal(err)
	}

	output, err := pubsub.Subscribe("test", 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	pubsub.DrainTopicsBuffer()

	if len(output.Flow) != 1 {
		t.Fatal("Bad output length")
	}
}

func TestReadFileValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"remove_after": 1}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"i_should_have_remove_after": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewReadFileHandler()

		for name, prop := range tc.Cfgs {
			err := rfg.GetConfiguration().SetProperty(name, prop)
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
