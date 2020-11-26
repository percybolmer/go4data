package payload

import (
	"errors"
	"testing"
)

func TestNewNetworkPayload(t *testing.T) {
	np, err := NewNetworkPayload(nil)
	if !errors.Is(err, ErrPayloadIsNotANetworkPayload) {
		t.Fatal("Should fail this")
	} else if np != nil {
		t.Fatal("np should be nil if failure")
	}

	np, err = NewNetworkPayload(&NetworkPayload{
		Source:  "OpenPcap",
		Payload: nil,
	})
	if err != nil {
		t.Fatal("Should not fail")
	}
	if np == nil {
		t.Fatal("Np should not be nil")
	}
}

func TestNetworkGettersAndSetters(t *testing.T) {
	np, err := NewNetworkPayload(&NetworkPayload{
		Source:  "OpenPcap",
		Payload: nil,
	})
	if err != nil {
		t.Fatal("should work")
	}
	length := np.GetPayloadLength()

	if length != 0 {
		t.Fatal("Wrong length")
	}

	np.SetSource("test")
	if np.GetSource() != "test" {
		t.Fatal("Wrong source")
	}
}
