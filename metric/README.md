# Metric
Metrics are stored by the handlers and processors to allow the user to know how the proccessing is going and to detect errors.

Metrics are handled by a interface called Provider that each Processor has assigned.  
The default is Prometheusprovider. 

Provider is a short interface
```golang
//Provider is a interface that is used to handle Different metric sources
type Provider interface {
	AddMetric(*Metric) error
	IncrementMetric(name string, value float64) error
	GetMetrics() map[string]*Metric
	GetMetric(name string) *Metric
}

```

## PrometheusProvider
Prometheusprovider is the default metric and is applied to all Handlers and processors unless changed.

To view the metrics, one needs to run 
```golang
	http.Handle("/metrics", promhttp.Handler())
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
```