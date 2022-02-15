package files

import (
	"errors"
	"os"
	"testing"

	"github.com/percybolmer/go4data/metric"
	"github.com/percybolmer/go4data/payload"
	"github.com/percybolmer/go4data/property"
	"github.com/percybolmer/go4data/pubsub"
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
	// Get DefaultEngine and Drain it
	de, err := pubsub.EngineAsDefaultEngine()
	if err != nil {
		t.Fatal(err)
	}
	de.DrainTopicsBuffer()

	if len(output.Flow) != 1 {
		t.Fatal("Bad output length")
	}
}
func TestReadFileMetrics(t *testing.T) {
	rfg := NewReadFileHandler()
	handler := rfg.(*ReadFile)

	if handler.Subscriptionless() {
		t.Fatal("should be subscriptionless")
	}

	if handler.GetErrorChannel() == nil {
		t.Fatal("Should not be nil errChan")
	}

	handler.SetMetricProvider(metric.NewPrometheusProvider(), "test2")
	if handler.metrics == nil {
		t.Fatal("Should not have failed to assigned metric")
	}

	if handler.metricPrefix != "test2" {
		t.Fatal("Pefix not applied")
	}
	if met := handler.metrics.GetMetric("test2_payloads_in"); met == nil {
		t.Fatal("Didnt create payload in metric")
	}
	if met := handler.metrics.GetMetric("test2_payloads_out"); met == nil {
		t.Fatal("Didnt create payload in metric")
	}
	if handler.GetHandlerName() != "ReadFile" {
		t.Fatal("Wrong handler name")
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

	rfg := NewReadFileHandler()
	rfg.GetConfiguration().RemoveProperty("remove_after")
	valid, err := rfg.ValidateConfiguration()
	if valid {
		t.Fatal("wrong, should not be valid without required topic")
	}
	if err[0] != "remove_after" {
		t.Fatal("Should have shown that remove_after property is missing")
	}
	rfg = NewReadFileHandler()
	rfg.GetConfiguration().SetProperty("remove_after", true)
	rfg.ValidateConfiguration()
	rf := rfg.(*ReadFile)
	if !rf.remove {
		t.Fatal("Didnt change or apply remove_after")
	}
}
