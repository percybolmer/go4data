package main

import (
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	flowbytes := promauto.NewCounter(prometheus.CounterOpts{
		Name: "processed_bytes_total",
		Help: "Total number of bytes",
	})

	go func() {
		for {
			flowbytes.Add(10)
			time.Sleep(2 * time.Second)
		}
	}()

	http.Handle("/metrics", promhttp.Handler())
	http.ListenAndServe(":2112", nil)

}
