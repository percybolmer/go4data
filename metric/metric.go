package metric

//Provider is a interface that is used to handle Different metric sources
type Provider interface {
	AddMetric(*Metric) error
	IncrementMetric(name string, value float64) error
	GetMetrics() map[string]*Metric
}

// Metric is information about a certain value of a processor with a name and description,
// currently all metric is int64, would be cool with interface, but I cant think of a reason
type Metric struct {
	Description string  `json:"description" yaml:"description"`
	Name        string  `json:"name" yaml:"name"`
	Value       float64 `json:"value" yaml:"value"`
}
