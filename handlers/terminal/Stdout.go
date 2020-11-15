// Package terminal contains Handlers related to STDOUT
package terminal

import (
	"context"
	"fmt"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
	"github.com/percybolmer/workflow/register"
)

// StdoutHandler is used to print payloads to stdout, great for debugging
type StdoutHandler struct {
	// Cfg is values needed to properly run the Handler
	Cfg  *property.Configuration `json:"configs" yaml:"configs"`
	Name string                  `json:"handler_name" yaml:"handler_name"`
	// forward will forward payloads printed if true
	forward bool
	// Metric is a metric container to publish Metrics from an Handler
	// subscriptionless is used to say if the Handler is subscriptionless
	subscriptionless bool
	errChan          chan error

	metrics      metric.Provider
	metricPrefix string
	// MetricPayloadOut is how many payloads the processor has outputted
	MetricPayloadOut string
	// MetricPayloadIn is how many payloads the processor has inputted
	MetricPayloadIn string
}

func init() {
	register.Register("Stdout", NewStdoutHandler())
}

// NewStdoutHandler generates a new Stdout Handler
func NewStdoutHandler() *StdoutHandler {
	act := &StdoutHandler{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:    "Stdout",
		forward: true,
		errChan: make(chan error, 1000),
	}
	act.Cfg.AddProperty("forward", "Set to true if payloads should be forwarded", false)
	return act
}

// GetHandlerName is used to retrun a unqiue string name
func (a *StdoutHandler) GetHandlerName() string {
	return a.Name
}

// Handle is used to print payloads to stdout
func (a *StdoutHandler) Handle(ctx context.Context, p payload.Payload, topics ...string) error {
	a.metrics.IncrementMetric(a.MetricPayloadIn, 1)
	fmt.Println(string(p.GetPayload()))
	if a.forward {
		errs := pubsub.PublishTopics(topics, p)
		for _, err := range errs {
			a.errChan <- err
		}
		a.metrics.IncrementMetric(a.MetricPayloadOut, 1)
	}
	return nil
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *StdoutHandler) ValidateConfiguration() (bool, []string) {
	// Check if Proxy forward is true

	valid, miss := a.Cfg.ValidateProperties()
	if !valid {
		return valid, miss
	}
	forwardProp := a.Cfg.GetProperty("forward")

	if forwardProp.Value == nil {
		return true, nil
	}
	forward, err := forwardProp.Bool()
	if err != nil {
		return false, []string{err.Error()}
	}
	a.forward = forward
	return true, nil
}

// GetConfiguration will return the CFG for the Handler
func (a *StdoutHandler) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return false since this Handler needs publishers
func (a *StdoutHandler) Subscriptionless() bool {
	return a.subscriptionless
}

// GetErrorChannel will return a channel that the Handler can output eventual errors onto
func (a *StdoutHandler) GetErrorChannel() chan error {
	return a.errChan
}

// SetMetricProvider is used to change what metrics provider is used by the handler
func (a *StdoutHandler) SetMetricProvider(p metric.Provider, prefix string) error {
	a.metrics = p
	a.metricPrefix = prefix

	a.MetricPayloadIn = fmt.Sprintf("%s_payloads_in", prefix)
	a.MetricPayloadOut = fmt.Sprintf("%s_payloads_out", prefix)
	err := a.metrics.AddMetric(&metric.Metric{
		Name:        a.MetricPayloadOut,
		Description: "keeps track of how many payloads the handler has outputted",
	})
	if err != nil {
		return err
	}
	err = a.metrics.AddMetric(&metric.Metric{
		Name:        a.MetricPayloadIn,
		Description: "keeps track of how many payloads the handler has ingested",
	})

	return err
}
