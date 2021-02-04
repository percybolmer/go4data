package files

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/percybolmer/go4data/metric"
	"github.com/percybolmer/go4data/property"
	"github.com/percybolmer/go4data/pubsub"
)

func TestListDirHandle(t *testing.T) {
	rfg := NewListDirectoryHandler()

	cfg := rfg.GetConfiguration()
	err := cfg.SetProperty("path", "testing/ListDir/")
	if err != nil {
		t.Fatal(err)
	}
	err = cfg.SetProperty("buffertime", 100)
	if err != nil {
		t.Fatal(err)
	}
	valid, _ := rfg.ValidateConfiguration()
	if !valid {
		t.Fatal("Wrong configuration")
	}
	// Run handle for 2 seconds then see if topic has the payload
	ctx := context.Background()
	ctxsub, cancel := context.WithCancel(ctx)

	go func() {
		time.Sleep(2 * time.Second)
		cancel()
	}()
	go rfg.Handle(ctxsub, nil, "foundfiles")

	time.Sleep(2 * time.Second)
	// Get items from topic and there should be 1
	output, err := pubsub.Subscribe("foundfiles", 1, 10)
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
		t.Fatal("Wrong length")
	}
}

func TestListDirectory(t *testing.T) {
	rfg := NewListDirectoryHandler()
	handler := rfg.(*ListDirectory)
	cfg := handler.GetConfiguration()
	err := cfg.SetProperty("path", "testing/ListDir")
	if err != nil {
		t.Fatal(err)
	}
	err = cfg.SetProperty("buffertime", 100)
	if err != nil {
		t.Fatal(err)
	}
	valid, _ := handler.ValidateConfiguration()
	if !valid {
		t.Fatal("Wrong configuration")
	}

	payloads, err := handler.ListDirectory()
	if err != nil {
		t.Fatal(err)
	}
	if len(payloads) != 1 {
		t.Fatal("Wrong length of payloads: ", len(payloads))
	}

}

func TestListDirectoryMetrics(t *testing.T) {
	rfg := NewListDirectoryHandler()
	handler := rfg.(*ListDirectory)

	if !handler.Subscriptionless() {
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
	if handler.GetHandlerName() != "ListDirectory" {
		t.Fatal("Wrong handler name")
	}
}

func TestListDirectoryValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: true, Cfgs: map[string]interface{}{"path": 0}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: true, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
	}

	for _, tc := range testCases {
		rfg := NewListDirectoryHandler()

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
