package databases

import (
	"testing"

	"github.com/percybolmer/workflow/metric"
)

func TestPutElasticSearchHandle(t *testing.T) {

}

func TestPutElasticSearchValidateConfiguration(t *testing.T) {

	putes := NewPutElasticSearchHandler()

	cfg := putes.GetConfiguration()

	err := cfg.SetProperty("ip", "127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	err = cfg.SetProperty("port", 9200)
	if err != nil {
		t.Fatal(err)
	}

	err = cfg.SetProperty("index", "test10")
	if err != nil {
		t.Fatal(err)
	}
	err = cfg.SetProperty("type", "thistesttype")
	if err != nil {
		t.Fatal(err)
	}

	valid, errs := putes.ValidateConfiguration()
	if !valid {
		for _, errStr := range errs {
			t.Fatal(errStr)
		}
	}

	putes.SetMetricProvider(metric.NewPrometheusProvider(), "test")
	/*err = putes.Handle(nil, payload.BasePayload{Payload: []byte(`{ "source": "test", "user": "Karl"}`)})
	if err != nil {

		t.Fatal(err)
	}*/
}
