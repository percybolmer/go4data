package metric

import (
	"testing"
)

func TestAddMetric(t *testing.T) {
	m := NewMetrics()

	shouldbenil := m.GetMetric("does_not_exist")

	if shouldbenil != nil {
		t.Fatal("Should have been nil when getting a non exisiing value")
	}

	m.AddMetric("cool_metric", "is cool", 10)

	coolMetric := m.GetMetric("cool_metric")

	if coolMetric == nil {
		t.Fatal("Should have found a metric")
	}

	m.AddMetric("cool_metric", "is cool", 10)

	if coolMetric.Value != 20 {
		t.Fatal("Failed to append value")
	}
}
