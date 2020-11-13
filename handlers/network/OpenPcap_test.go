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

	pcapHandler.bpf = "tcp and ip"
	payloads, err := pcapHandler.Handle(testPayload)
	if err != nil {
		t.Fatal(err)
	}

	for _, pay := range payloads {
		netpay, err := NewPayload(pay)
		if err != nil {
			t.Fatal(err)
		}
		if len(netpay.Payload) != 1 {
			t.Fatalf("Wrong packet length, %d", len(netpay.Payload))
		}
	}
}
