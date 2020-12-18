package terminal

import (
	"errors"
	"fmt"
	"testing"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
)

func TestExecCMDHandle(t *testing.T) {
	rfgh := NewExecCMDHandler()
	rfg := rfgh.(*ExecCMD)
	rfg.Cfg.SetProperty("command", "echo")
	//rfg.Cfg.SetProperty("arguments", map[string]interface{}{"hello": "world"})
	rfg.Cfg.SetProperty("arguments", []string{"Hello", "World!"})
	pay, err := rfg.Exec(nil)
	if !errors.Is(err, ErrEmptyCommand) {
		t.Fatal(err)
	}

	rfg.ValidateConfiguration()
	pay, err = rfg.Exec(nil)

	if string(pay.GetPayload()) != "Hello World!\n" {
		//t.Log(pay.GetPayload())
		t.Fatalf("Wrong payload found: %s", string(pay.GetPayload()))
	}
	// test with Flags
	rfg.Cfg.SetProperty("arguments", []string{"-n", "Hello", "World!"})
	rfg.ValidateConfiguration()
	pay, _ = rfg.Exec(nil)

	if string(pay.GetPayload()) != "Hello World!" {
		//t.Log(pay.GetPayload())
		//t.Log(pay.GetSource())
		t.Fatalf("Wrong payload with Flags found: %s", string(pay.GetPayload()))
	}
	// test with Payload
	rfg.Cfg.SetProperty("arguments", []string{"-n", "Hello", "payload!"})
	rfg.ValidateConfiguration()
	pay = payload.NewBasePayload([]byte("World"), "test", nil)
	pay, err = rfg.Exec(pay)

	if err != nil {
		t.Fatal(err)
	}
	if string(pay.GetPayload()) != "Hello World!" {
		t.Fatal("Wrong output off exec command with payload flag")
	}

	rfg.Cfg.SetProperty("append_old_payload", true)
	rfg.Cfg.SetProperty("append_delimiter", "->")
	rfg.ValidateConfiguration()
	pay = payload.NewBasePayload([]byte("World"), "test", nil)
	pay, err = rfg.Exec(pay)
	if err != nil {
		t.Fatal(err)
	}
	if string(pay.GetPayload()) != "World->Hello World!" {
		t.Fatal("Wrong payload back after append: ", string(pay.GetPayload()))
	}
	output, err := pubsub.Subscribe("output", 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	pay = payload.NewBasePayload([]byte("World"), "test", nil)
	err = rfg.Handle(nil, pay, "output")
	if err != nil {
		t.Fatal(err)
	}

	if len(output.Flow) != 1 {
		t.Fatal("Didnt properly receive item")
	}

}

func TestExecCMDValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"arguments": 1}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewExecCMDHandler()

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

func TestExecCMDDefaultHanlder(t *testing.T) {
	rfg := NewExecCMDHandler()

	cfg := rfg.GetConfiguration()

	cfg.SetProperty("command", "echo")
	cfg.SetProperty("append_old_payload", "not a bool")

	valid, errs := rfg.ValidateConfiguration()
	if valid {
		t.Fatal("Should have failed with bad property type")
	}
	if len(errs) != 0 {
		if errs[0] != property.ErrWrongPropertyType.Error() {
			t.Fatal("Should have complained about payload type")
		}
	}
	cfg.SetProperty("append_old_payload", true)
	cfg.SetProperty("append_delimiter", "|")

	valid, errs = rfg.ValidateConfiguration()
	if !valid {
		t.Fatal("Should be valid with all properties set")
	}
	handler := rfg.(*ExecCMD)
	if !handler.appendOldPayload || handler.appendDelimiter != "|" {
		t.Fatal("Should have applied append parameters to handler")
	}

	cfg.SetProperty("arguments", true)

	valid, errs = rfg.ValidateConfiguration()
	if valid {
		t.Fatal("Should not have been valid with bad arguments")
	}
	if !rfg.Subscriptionless() {
		t.Fatal("Wrong subscription value")
	}
	cfg.SetProperty("arguments", []string{"payload"})

	valid, errs = rfg.ValidateConfiguration()
	if !valid {
		t.Fatal()
	}

	if rfg.Subscriptionless() {
		t.Fatal("Wrong subscription value")
	}
	if rfg.GetErrorChannel() == nil {
		t.Fatal("Should return an error channel")
	}

}

func TestExecCMDSetMetric(t *testing.T) {
	rfg := NewExecCMDHandler()

	err := rfg.SetMetricProvider(metric.NewPrometheusProvider(), "exec_provider")
	if err != nil {
		t.Fatal(err)
	}
	handler := rfg.(*ExecCMD)

	if handler.metrics == nil {
		t.Fatal("Metrics not created")
	}
	if handler.metricPrefix != "exec_provider" {
		t.Fatal("Metricsprefix not applied")
	}

	if handler.MetricPayloadIn != fmt.Sprintf("%s_payloads_in", "exec_provider") {
		t.Fatal("Payloads in metric is wrong")
	} else if handler.MetricPayloadOut != fmt.Sprintf("%s_payloads_out", "exec_provider") {
		t.Fatal("payloads out metric is wrong")
	}

	if handler.metrics.GetMetric("exec_provider_payloads_out") == nil {
		t.Fatal("Didnt create payloads out")
	} else if handler.metrics.GetMetric("exec_provider_payloads_in") == nil {
		t.Fatal("Didnt create payloads in")
	}
}
