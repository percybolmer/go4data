// this is purely for testing
package main

import (
	"log"
	"net/http"

	"github.com/perbol/workflow/metric"
	_ "github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	test := metric.NewPrometheusProvider()
	err := test.AddMetric(&metric.Metric{
		Name:        "testing_metric_values",
		Description: " for testing",
	})
	if err != nil {
		log.Fatal(err)
	}
	err = test.IncrementMetric("testing_metric_values", 10)
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/metrics", promhttp.Handler())
	http.ListenAndServe(":2112", nil)
}
