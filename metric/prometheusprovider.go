package metric

import (
	"errors"
	"sync"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	//ErrMetricAlreadyExist is when trying to add a new metric but it collides with another named metric
	ErrMetricAlreadyExist = errors.New("trying to add a metric that already exists, instead try to increment it")
	// ErrMetricNotFound is when trying to increment a nonfound metric
	ErrMetricNotFound = errors.New("trying to increment a missing metric")
)

// PrometheusProvider is a simple Provider for Prom metric
// for now only support Float64, maybe add more in the future
type PrometheusProvider struct {
	Metrics map[string]*Metric `json:"metrics"`
	// PromMetric is actually just a mirror of Metrics, its used to export the metric
	// The reaason why we contain our own Metric aswell is because it seems hard to extract values from Prom package
	PromMetrics map[string]prometheus.Counter `json:"-"`
	sync.Mutex
}

// NewPrometheusProvider will generate a new metrics holder
func NewPrometheusProvider() *PrometheusProvider {
	return &PrometheusProvider{
		Metrics:     make(map[string]*Metric, 0),
		PromMetrics: make(map[string]prometheus.Counter, 0),
	}
}

// AddMetric is used to add new metrics, or append to old metric
func (pp *PrometheusProvider) AddMetric(m *Metric) error {
	if pp.Metrics == nil {
		pp.Metrics = make(map[string]*Metric, 0)
	}
	if pp.PromMetrics == nil {
		pp.PromMetrics = make(map[string]prometheus.Counter, 0)
	}

	if _, ok := pp.Metrics[m.Name]; ok {
		return ErrMetricAlreadyExist
	}

	pp.Metrics[m.Name] = m
	promCounter := promauto.NewCounter(prometheus.CounterOpts{
		Name: m.Name,
		Help: m.Description,
	})
	promCounter.Add(m.Value)
	pp.PromMetrics[m.Name] = promCounter
	return nil
}

// IncrementMetric is used to increase value of metric
func (pp *PrometheusProvider) IncrementMetric(name string, value float64) error {
	if pp.PromMetrics[name] == nil || pp.Metrics[name] == nil {
		return ErrMetricNotFound
	}

	pp.PromMetrics[name].Add(value)
	pp.Metrics[name].Value = pp.Metrics[name].Value + value
	return nil
}

// GetMetrics is used to extract all metrics
func (pp *PrometheusProvider) GetMetrics() map[string]*Metric {
	return pp.Metrics
}

// GetMetric will return a metric if it exists, or nil if not
func (pp *PrometheusProvider) GetMetric(name string) *Metric {
	if met, ok := pp.Metrics[name]; ok {
		return met
	}
	return nil
}
