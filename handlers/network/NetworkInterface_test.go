package network

import (
	"errors"
	"testing"

	"github.com/percybolmer/workflow/property"
)

/*func TestNetworkInterfaceHandle(t *testing.T) {
	rfg := NewNetworkInterfaceHandler()

	rfg.SetMetricProvider(metric.NewPrometheusProvider(), "test_sniff")

	rfg.Cfg.SetProperty("interface", "wlp3s0")
	worked, _ := rfg.ValidateConfiguration()
	if !worked {
		//t.Fatal(errs) dont fail here since it break githubs Action
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
	exit := time.NewTicker(2 * time.Second)
	for {
		select {
		case pay := <-pipe.Flow:
			if pay != nil {
				break
			}
			netpay, err := payload.NewNetworkPayload(pay)
			if err != nil {
				t.Fatal(err)
			}

			log.Println(netpay.Payload.Dump())
		case <-exit.C:
			return
		}
	}

}
*/
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
