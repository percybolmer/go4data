package terminal

import (
	"errors"
	"testing"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
)

func TestHandle(t *testing.T) {
	rfg := NewStdoutHandler()
	cfg := rfg.GetConfiguration()

	err := cfg.SetProperty("forward", true)
	if err != nil {
		t.Fatal(err)
	}

	rfg.SetMetricProvider(metric.NewPrometheusProvider(), "teststdouthandler")

	err = rfg.Handle(nil, payload.NewBasePayload([]byte("test"), "test", nil), "test")
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

func TestValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"forward": "hee"}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"i_should_have_remove_after": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewStdoutHandler()

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

	rfg := NewStdoutHandler()
	rfg.GetConfiguration().RemoveProperty("forward")
	valid, err := rfg.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid after removing required property")
	}
	if err[0] != "forward" {
		t.Fatal("Should warn that forward is not set")
	}

	rfg = NewStdoutHandler()
	rfg.GetConfiguration().SetProperty("forward", true)
	rfg.ValidateConfiguration()
	rf := rfg.(*StdoutHandler)
	if !rf.forward {
		t.Fatal("didnt apply properties")
	}
}

func TestStdoutMetrics(t *testing.T) {
	rfg := NewStdoutHandler()
	handler := rfg.(*StdoutHandler)

	if handler.Subscriptionless() {
		t.Fatal("should be subscriptionless")
	}

	if handler.GetErrorChannel() == nil {
		t.Fatal("Should not be nil errChan")
	}

	handler.SetMetricProvider(metric.NewPrometheusProvider(), "test")
	if handler.metrics == nil {
		t.Fatal("Should not have failed to assigned metric")
	}

	if handler.metricPrefix != "test" {
		t.Fatal("Pefix not applied")
	}
	if met := handler.metrics.GetMetric("test_payloads_in"); met == nil {
		t.Fatal("Didnt create payload in metric")
	}
	if met := handler.metrics.GetMetric("test_payloads_out"); met == nil {
		t.Fatal("Didnt create payload in metric")
	}
	if handler.GetHandlerName() != "Stdout" {
		t.Fatal("Wrong handler name")
	}
}
