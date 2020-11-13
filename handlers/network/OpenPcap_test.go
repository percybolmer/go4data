package network

import (
	"testing"

	"github.com/percybolmer/workflow/payload"
)

func TestOpenPcapHandle(t *testing.T) {
	pcapHandler := NewOpenPcapHandler()

	testPayload := payload.BasePayload{
		Source:  "test",
		Payload: []byte(`testing/tcpSpoof.pcap`),
	}

	payloads, err := pcapHandler.Handle(testPayload)
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("%+v", payloads)
}
