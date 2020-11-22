package network

import (
	"context"
	"errors"
	"log"
	"testing"
	"time"

	"github.com/percybolmer/workflow/handlers/payloads"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
)

func TestNetworkInterfaceHandle(t *testing.T) {
	rfg := NewNetworkInterfaceHandler()

	rfg.SetMetricProvider(metric.NewPrometheusProvider(), "test_sniff")

	rfg.Cfg.SetProperty("interface", "wlp3s0")
	worked, errs := rfg.ValidateConfiguration()
	if !worked {
		t.Fatal(errs)
	}

	go func() {
		err := rfg.Handle(context.Background(), nil, "sniffed")
		if err != nil {

			log.Fatal(err)
		}

	}()
	go func() {
		for err := range rfg.errChan {
			if err != nil {
				log.Fatal(err)
			}
		}
	}()
	time.Sleep(2 * time.Second)

	pipe, err := pubsub.Subscribe("sniffed", 1, 100)
	if err != nil {
		t.Fatal(err)
	}

	for pay := range pipe.Flow {
		if pay != nil {
			break
		}
		netpay, err := payloads.NewNetworkPayload(pay)
		if err != nil {
			t.Fatal(err)
		}

		log.Println(netpay.Payload.Dump())
	}

}

func TestNetworkInterfaceValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"promiscuousmode": 1}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewNetworkInterfaceHandler()

		for name, prop := range tc.Cfgs {
			err := rfg.Cfg.SetProperty(name, prop)
			if !errors.Is(err, tc.ExpectedErr) {
				if err != nil && tc.ExpectedErr != nil {
					t.Fatalf("%s Expected: %s, but found: %s", tc.Name, tc.ExpectedErr, err.Error())
				}

			}
		}

		valid, _ := rfg.ValidateConfiguration()
		if !tc.IsValid && valid {
			t.Fatal("Missmatch between Valid and tc.IsValid")
		}
	}
}
