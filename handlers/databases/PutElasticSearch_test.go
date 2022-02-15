package databases

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	elasticsearch6 "github.com/elastic/go-elasticsearch/v6"
	elasticsearch7 "github.com/elastic/go-elasticsearch/v7"
	"github.com/percybolmer/go4data/metric"
	"github.com/percybolmer/go4data/payload"
	"github.com/percybolmer/go4data/property"
	"github.com/percybolmer/go4data/pubsub"
)

var handler = func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	w.Write([]byte(`ok`))
}

func TestPutElasticSearchHandle(t *testing.T) {
	// Start fake api
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler(w, r)
	}))

	defer ts.Close()
	esHand := NewPutElasticSearchHandler()
	es := esHand.(*PutElasticSearch)

	cfg := es.GetConfiguration()
	cfg.AddProperty("mock", "a mock flag", false)
	cfg.SetProperty("mock", true)
	if err := cfg.SetProperty("ip", "127.0.0.1"); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("port", 9200); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("index", "test"); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("type", "testdata"); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("version", "7.1"); err != nil {
		t.Fatal(err)
	}
	valid, errs := es.ValidateConfiguration()
	if !valid {
		t.Fatal(errs)
	}
	if es.es7 == nil {
		t.Fatal("es7 seems to be nil")
	}
	// Replace es7 with MOck client
	client, err := elasticsearch7.NewClient(elasticsearch7.Config{
		Addresses: []string{
			ts.URL,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	es.es7 = client

	// Now that its setup, create a payload with some data and try sending it
	// Later replace and setup a fake http Callback so we dont need a real elasticnode up and runnin
	payload := payload.NewBasePayload([]byte(`{ "username": "testersson" }`), "test", nil)

	err = es.Handle(context.Background(), payload, "test")
	if err != nil {
		t.Fatal(err)
	}

	pipe, err := pubsub.Subscribe("test", 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	// Get DefaultEngine and Drain it
	de, err := pubsub.EngineAsDefaultEngine()
	if err != nil {
		t.Fatal(err)
	}
	de.DrainTopicsBuffer()

	if len(pipe.Flow) != 1 {
		t.Fatal("Found no payload on topic")
	}

	// Replace es6 with MOck client
	client2, err := elasticsearch6.NewClient(elasticsearch6.Config{
		Addresses: []string{
			ts.URL,
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	es.es6 = client2
	es.es7 = nil
	err = es.Handle(context.Background(), payload, "test")
	if err != nil {
		t.Fatal(err)
	}
	if len(pipe.Flow) != 2 {
		t.Fatal("Wrong payload length of topic: ", len(pipe.Flow))
	}

}

func TestPutElasticSearchValidateConfiguration(t *testing.T) {

	esHand := NewPutElasticSearchHandler()
	es := esHand.(*PutElasticSearch)

	cfg := es.GetConfiguration()
	cfg.RemoveProperty("ip")
	valid, errs := es.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid without any properties")
	}
	if len(errs) == 1 {
		if errs[0] != "ip" {
			t.Fatal("Should detect missing property")
		}
	}
	cfg.AddProperty("mock", " a mock flag", false)
	cfg.SetProperty("mock", true)
	cfg.AddProperty("ip", "an ip to es", true)
	if err := cfg.SetProperty("ip", "127.0.0.1"); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("port", 9200); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("index", "test"); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("type", "testdata"); err != nil {
		t.Fatal(err)
	}
	if err := cfg.SetProperty("version", "7.1"); err != nil {
		t.Fatal(err)
	}
	valid, errs = es.ValidateConfiguration()
	if !valid {
		t.Fatal(errs)
	}
	if es.es6 != nil || es.es7 == nil {
		t.Fatal("Wrong elasticclient created")
	}
	cfg.SetProperty("version", "6.5")
	valid, errs = es.ValidateConfiguration()
	if !valid {
		t.Fatal(errs)
	}
	if es.es6 == nil || es.es7 != nil {
		t.Fatal("Wrong elasticclient created")
	}
	cfg.SetProperty("version", "5.4")
	valid, errs = es.ValidateConfiguration()
	if valid {
		t.Fatal("Should be unsupported version")
	}
	if es.es6 != nil || es.es7 != nil {
		t.Fatal("es clients not cleared out correctly")
	}
	cfg.SetProperty("version", "")
	valid, errs = es.ValidateConfiguration()
	if valid {
		t.Fatal("Should not allow empty version")
	} else {
		if len(errs) == 0 {
			t.Fatal("Should not allow empty version")
		} else if errs[0] != "cannot have an empty version, please use 6.X or 7.X" {
			t.Fatal("wrong error on empty version: ", errs[0])
		}
	}

	// Now we know regular stuff works, lets put bad stuff
	cfg.SetProperty("index", "")
	valid, errs = es.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid")
	} else {
		if len(errs) == 0 {
			t.Fatal("Should have found error for empty index")
		} else if errs[0] != "cannot have an empty index" {
			t.Fatal("Wrong error found, should be empty index error")
		}
	}
	cfg.SetProperty("index", "test")
	cfg.SetProperty("type", "")
	valid, errs = es.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid")
	} else {
		if len(errs) == 0 {
			t.Fatal("Should have found error for empty type")
		} else if errs[0] != "cannot use empty type" {
			t.Fatal("Wrong error found, should be empty type error")
		}
	}
	cfg.SetProperty("type", "test")
	cfg.SetProperty("ip", "")
	valid, errs = es.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid")
	} else {
		if len(errs) == 0 {
			t.Fatal("Should have found error for empty ip")
		} else if errs[0] != "cannot use empty ip" {
			t.Fatal("Wrong error found, should be empty ip error")
		}
	}
	cfg.SetProperty("ip", "127.0.0.1")
	cfg.SetProperty("port", "hello")
	valid, errs = es.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid")
	} else {
		if len(errs) == 0 {
			t.Fatal("Should have found bad type for port")
		} else if errs[0] != property.ErrWrongPropertyType.Error() {
			t.Fatal("Wrong error found, should be bad type on port")
		}
	}
	errChan := es.GetErrorChannel()
	if errChan == nil {
		t.Fatal("errChan should not be nil")
	}
	if es.Subscriptionless() {
		t.Fatal("Isnt subscriptionless")
	}

	es.SetMetricProvider(metric.NewPrometheusProvider(), "test")

	if es.metrics == nil {
		t.Fatal("Failed to assgin new metric provider")
	}
	if es.metricPrefix != "test" {
		t.Fatal("Prefix not  applied")
	}
	if met := es.metrics.GetMetric("test_payloads_in"); met == nil {
		t.Fatal("Didnt create payloads in metric")
	}

	if es.GetHandlerName() != "PutElasticSearch" {
		t.Fatal("Wrong handler name")
	}
}
