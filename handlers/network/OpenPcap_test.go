package network

import (
	"context"
	"testing"
	"time"

	"github.com/percybolmer/go4data/metric"
	"github.com/percybolmer/go4data/payload"
	"github.com/percybolmer/go4data/pubsub"
)

func TestOpenPcapHandle(t *testing.T) {
	pcapHandlerH := NewOpenPcapHandler()
	pcapHandler := pcapHandlerH.(*OpenPcap)
	testPayload := &payload.BasePayload{
		Source:  "test",
		Payload: []byte(`testing/tcpSpoof.pcap`),
	}
	pcapHandler.SetMetricProvider(metric.NewPrometheusProvider(), "pcaphandler")
	pcapHandler.bpf = "tcp and ip"
	err := pcapHandler.Handle(context.Background(), testPayload, "packets")
	if err != nil {
		t.Fatal(err)
	}

	pipe, err := pubsub.Subscribe("packets", 1, 100)
	if err != nil {
		t.Fatal(err)
	}

	exit := time.NewTicker(2 * time.Second)

	for {
		select {
		case pay := <-pipe.Flow:
			netpay, err := payload.NewNetworkPayload(pay)
			if err != nil {
				t.Fatal(err)
			}
			if len(netpay.Payload.Data()) == 0 {
				t.Fatalf("Wrong packet length, %s", netpay.Payload.Dump())
			}
			//t.Log(netpay.Payload.Dump())

		case <-exit.C:
			return
		}
	}
}

func TestValidateConfiguration(t *testing.T) {
	rfg := NewOpenPcapHandler()
	if rfg.GetErrorChannel() == nil {
		t.Fatal("Should return error channel")
	}
	if rfg.GetConfiguration() == nil {
		t.Fatal("Should return a configuration")
	}
	if rfg.Subscriptionless() {
		t.Fatal("OpenPcap is a  not subscriptionless handler")
	}

	rfg.GetConfiguration().SetProperty("bpf", "test")
	valid, err := rfg.ValidateConfiguration()
	if !valid {
		t.Fatal("Should never fail without any requirements")
	}
	if len(err) != 0 {
		t.Fatal("Should not return any errors")
	}
	handler := rfg.(*OpenPcap)
	if handler.bpf != "test" {
		t.Fatal("Didnt apply bpf filter")
	}

	if rfg.GetHandlerName() != "OpenPcap" {
		t.Fatal("wrong named supplied")
	}

}
