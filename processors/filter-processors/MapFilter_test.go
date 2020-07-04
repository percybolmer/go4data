package filterprocessors

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/relationships"
)

func TestMapFilter_Initialize(t *testing.T) {
	proc := NewMapFilter()
	// Empty Init should fail
	err := proc.Initialize()
	if err == nil {
		t.Fatal("Should have failed to initialize without proper Properties set")
	}
	proc.SetProperty("filters", true)
	proc.SetProperty("strict", true)
	err = proc.Initialize()
	if err == nil {
		t.Fatal("Should have failed to init if the filters is the wrong property")
	}
	filters := make(map[string]string, 2)
	filters["test"] = "devel"
	filters["hello"] = "world"
	proc.SetProperty("filters", filters)

	err = proc.Initialize()
	if err != nil {
		t.Fatalf("Should have completed the initialization correctly: %s", err)
	}

}

func TestMapFilter_IsMatch(t *testing.T) {
	input := make(map[string]string, 4)
	input["hello"] = "world"
	input["devel"] = "test"
	input["kangaroo"] = "baby"
	input["findme"] = "great"
	d, _ := json.Marshal(input)
	realPayload := payload.BasePayload{
		Payload: d,
		Source:  "goodpayload",
	}

	filters := make(map[string]string, 4)
	filters["hello"] = "world"
	filters["findme"] = "test"

	proc := NewMapFilter()
	proc.filters = filters
	out, err := proc.IsPayloadMap(realPayload)
	if err != nil {
		t.Fatal("real map should be fine")
	}
	// Should not fail since strict is not active and findme has the wrong value
	if !proc.IsMatch(out) {
		t.Fatal("should have passed is match since we dont have strict mode")
	}
	proc.strict = true
	if proc.IsMatch(out) {
		t.Fatal("should have failed since we now have strict mode activated")
	}
}
func TestMapFilter_IsPayloadMap(t *testing.T) {
	// Bad payload and real payload
	// Strict and non strict
	filters := make(map[string]string, 4)
	filters["hello"] = "world"
	filters["devel"] = "test"
	filters["kangaroo"] = "baby"
	filters["findme"] = "great"
	d, _ := json.Marshal(filters)
	badPayload := payload.BasePayload{
		Payload: []byte(`hello world`),
		Source:  "badpayload",
	}
	realPayload := payload.BasePayload{
		Payload: d,
		Source:  "goodpayload",
	}

	proc := NewMapFilter()
	_, err := proc.IsPayloadMap(badPayload)
	if err == nil {
		t.Fatal("Should be errors if its a bad payload")
	}

	_, err = proc.IsPayloadMap(realPayload)
	if err != nil {
		t.Fatal("real map should be fine")
	}

}

func TestMapFilter_StopStart(t *testing.T) {
	proc := NewMapFilter()

	if proc.IsRunning() {
		t.Fatal("proccessor should not be running after creation")
	}
	ingress := make(relationships.PayloadChannel, 0)
	proc.SetIngress(ingress)
	err := proc.Start(context.TODO())
	if !errors.Is(err, ErrNotInitialized) {
		t.Fatal("processor should have failed without initialize")
	}

	proc.SetProperty("strict", true)
	filters := make(map[string]string, 2)
	filters["test"] = "devel"
	filters["hello"] = "world"
	proc.SetProperty("filters", filters)
	err = proc.Initialize()
	if err != nil {
		t.Fatal(err)
	}
	err = proc.Start(context.TODO())
	if err != nil {
		t.Fatal(err)
	}
	proc.Stop()
	err = proc.Start(context.TODO())
	if err != nil {
		t.Fatal("a restart should have been able to run")
	}
}
