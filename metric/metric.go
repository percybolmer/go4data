package metric

import "sync"

// MetricProvider is a interface that handles all Metric related things
type MetricProvider interface {
	GetMetrics() []*Metric
}

// Metric is information about a certain value of a processor with a name and description,
// currently all metric is int64, would be cool with interface, but I cant think of a reason
type Metric struct {
	Description string `json:"description"`
	Name        string `json:"name"`
	Value       int64  `json:"value"`
}

// Metrics is a basic placeholder that fullfills MetricProvider
type Metrics struct {
	sync.Mutex
	metric []*Metric
}

// NewMetrics will generate a new metrics holder
func NewMetrics() Metrics {
	return Metrics{
		metric: make([]*Metric, 0),
	}
}

// AddMetric is used to add new metrics, or append to old metric
func (m *Metrics) AddMetric(name, description string, value int64) {
	if m.metric == nil {
		m.metric = make([]*Metric, 0)
	}

	oldMet := m.GetMetric(name)
	if oldMet == nil {
		m.Lock()
		m.metric = append(m.metric, &Metric{
			Name:        name,
			Description: description,
			Value:       value,
		})
		m.Unlock()
	} else {
		m.Lock()
		oldMet.Value += value
		m.Unlock()
	}

}

// GetMetric returns a metric or a nil
func (m *Metrics) GetMetric(name string) *Metric {
	if m.metric == nil {
		return nil
	}

	for _, met := range m.metric {
		if met.Name == name {
			return met
		}
	}
	return nil
}
