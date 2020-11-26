package payload

import (
	"regexp"
	"testing"
)

func TestNewBasePayload(t *testing.T) {
	payload := NewBasePayload([]byte("data"), "test", nil)

	if payload.GetMetaData() == nil {
		t.Fatal("Meta should not be nil")
	}

	if payload.Source != "test" {
		t.Fatal("Wrong source")
	} else if string(payload.GetPayload()) != "data" {
		t.Fatal("wrong payload")
	}
}

func TestBasePayloadApplyFilter(t *testing.T) {
	payload := NewBasePayload([]byte("data"), "test", nil)

	reg, err := regexp.Compile("data")
	if err != nil {
		t.Fatal(err)
	}
	f := &Filter{
		GroupName: "test",
		Key:       "hello",
		Regexp:    reg,
	}

	if !payload.ApplyFilter(f) {
		t.Fatal("Filter should apply")
	}
}

func TestBasePayloadGettersAndSetters(t *testing.T) {
	payload := NewBasePayload([]byte("data"), "test", nil)

	length := payload.GetPayloadLength()

	if length != 4 {
		t.Fatal("Wrong length")
	}
	payload.SetPayload([]byte("test"))
	data := payload.GetPayload()

	if string(data) != "test" {
		t.Fatal("Wrong data")
	}

	payload.SetSource("test")
	if payload.GetSource() != "test" {
		t.Fatal("Wrong source")
	}
}
