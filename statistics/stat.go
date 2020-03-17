package statistics

import (
	"sync"

	"github.com/prometheus/client_golang/prometheus"
)

// Stat represents a value and a prometheus value which will default to "counter"
type Stat struct {
	//Value is the current value of the stat
	Value float64 `json:"value"`
	//Type represents the Type to use in prometheus exporter allowed valuse [CounterType,GougeType,HistogramType,SummaryType]
	// read more on https://prometheus.io/docs/concepts/metric_types/
	Type int `json:"type"`
	// Description is used to describe what the stat is about
	Description string `json:"description"`
	// Name is used to present the value
	Name string `json:"name"`

	// Below are values required for Prometheus export
	//Prometheus is a boolean to show if the stat is exported
	Prometheus bool `json:"prometheusexported"`
	counter    prometheus.Counter
	gauge      prometheus.Gauge
	historgram prometheus.Histogram
	summary    prometheus.Summary
	sync.Mutex
}

// AppendValue will take care of appending value to the current value
func (s *Stat) AppendValue(value float64) {
	defer s.Unlock()
	s.Lock()
	if s.Prometheus {
		switch s.Type {
		case CounterType:
			if s.counter != nil {
				s.counter.Add(value)
			} else {

				s.exportPrometheusStat()
				s.counter.Add(value)
			}
		case GaugeType:
			if s.gauge != nil {
				s.gauge.Add(value)
			} else {
				s.exportPrometheusStat()
				s.gauge.Add(value)
			}
		case HistogramType:
			if s.historgram != nil {
				// TODO fix historgram
			}
		case SummaryType:
			//TODO fix summary type
		}
	}

	s.Value = s.Value + value
}

// exportPrometheusStat will create a new value based on the type
func (s *Stat) exportPrometheusStat() {
	switch s.Type {
	case CounterType:
		s.counter = prometheus.NewCounter(prometheus.CounterOpts{
			Name: s.Name,
			Help: s.Description,
		})
		s.counter.Add(s.Value)
	case GaugeType:
		s.gauge = prometheus.NewGauge(prometheus.GaugeOpts{
			Name: s.Name,
			Help: s.Description,
		})
		s.gauge.Add(s.Value)
	case HistogramType:
		s.historgram = prometheus.NewHistogram(prometheus.HistogramOpts{
			Name: s.Name,
			Help: s.Description,
		})
	case SummaryType:
		s.summary = prometheus.NewSummary(prometheus.SummaryOpts{
			Name: s.Name,
			Help: s.Description,
		})
	default:
		s.counter = prometheus.NewCounter(prometheus.CounterOpts{
			Name: s.Name,
			Help: s.Description,
		})
	}
	s.Prometheus = true
}
