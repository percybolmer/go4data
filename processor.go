// Package workflow is a package that is used to create procescors that runs any kind of handler on a payload flow
// The payloads will be transferd between processors that has a relationship assigned
package workflow

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/perbol/workflow/handlers"
	"github.com/perbol/workflow/metric"
	"github.com/perbol/workflow/payload"
	"github.com/perbol/workflow/property"
	"github.com/perbol/workflow/pubsub"
)

// Processor is used to perform an Handler on each Item that is ingressed
type Processor struct {
	// ID is a unique identifier for each processor,
	ID uint `json:"id" yaml:"id"`
	// Name is a user configured Name for a processor that can be used relatd to an Processor easier than an ID, cannot be duplicate tho
	// It will be changed to be duplicates later, but for now PrometheusMetrics crashes.
	Name string `json:"name" yaml:"name"`
	// Running is a boolean indicator if the processor is currently Running
	Running bool `json:"running" yaml:"running"`
	// FailureHandler is the failurehandler to use with the Processor
	FailureHandler func(f Failure) `json:"-" yaml:"-"`
	// Handler is the handler to Perform on the Payload  received
	Handler handlers.Handler `json:"handler" yaml:"handler"`
	// Subscriptions is a slice of all the current Subscriptions
	// A Subscription will input data into the Processor
	subscriptions []*pubsub.Pipe
	// Topics is the Topics to publish payload onto
	Topics []string `json:"topics" yaml:"topics"`
	// ExecutionInterval is how often to execute the interval, this only
	// applies to Selfpublishing handler
	ExecutionInterval time.Duration `json:"executioninterval" yaml:"executioninterval"`
	// QueueSize is a integer of how many payloads are accepted on the Output channels to Subscribers
	QueueSize int `json:"queuesize" yaml:"queuesize"`
	// Metric is used to store metrics
	Metric metric.Provider `json:"-" yaml:"-"`
	//cancel is used by the processor the handle cancellation
	cancel     context.CancelFunc
	sync.Mutex `json:"-" yaml:"-"`
}

var (
	//IDCounter is used to make sure no processors are generated with a ID that already exists
	IDCounter uint = 1
	// DefaultExecutionInterval is the default time between executions
	DefaultExecutionInterval = 10 * time.Second
	// DefaultQueueSize is a limit set to define how many payloads can be sent in queue
	DefaultQueueSize = 1000

	//ErrProcessorHasNoHandlerApplied is when starting a processor that has a nil Handler
	ErrProcessorHasNoHandlerApplied = errors.New("the processor has no Handler set. Please assign a Handler to it before running")
	//ErrNilContext not allowed
	ErrNilContext = errors.New("nil context is not allowed when starting a processor")
	//ErrProcessorAlreadyStopped is when trying to stop a processor that is alrady stopped
	ErrProcessorAlreadyStopped = errors.New("the processor is already stopped")
	//ErrRequiredPropertiesNotFulfilled is when trying to start a Handler but it needs additonal properties
	ErrRequiredPropertiesNotFulfilled = errors.New("the Handler needs additional properties to work, see the Handlers documentation")
	//ErrHandlerDoesNotAcceptPublishers is when trying to register an publisher to a processor that has a selfpublishing Handler
	ErrHandlerDoesNotAcceptPublishers = errors.New("the used Handler does not allow publishers")
	//ErrDuplicateTopic is when trying to register an duplicate TOPIC to publish to
	ErrDuplicateTopic = errors.New("the topic is already registerd")
	// ErrFailedToUnmarshal is thrown when trying to unmarhsla workflows but it fails
	ErrFailedToUnmarshal = errors.New("failed to unmarshal since data provided is not correct")
)

// NewID is used to generate a new ID
func NewID() uint {
	IDCounter++
	return IDCounter - 1
}

// NewProcessor is used to spawn a new processor
// You need to set a Registerd Handler or it will return an error
// Topics is a vararg that allows you to insert any topic you want the processor
// to publish its payloads to
func NewProcessor(name string, topics ...string) *Processor {
	proc := &Processor{
		ID:                NewID(),
		Name:              name,
		FailureHandler:    PrintFailure,
		Handler:           nil,
		subscriptions:     make([]*pubsub.Pipe, 0),
		Topics:            make([]string, 0),
		ExecutionInterval: DefaultExecutionInterval,
		QueueSize:         DefaultQueueSize,
		Metric:            metric.NewPrometheusProvider(),
	}
	if len(topics) != 0 {
		proc.Topics = append(proc.Topics, topics...)
	}

	// Add Some default Metric values
	proc.Metric.AddMetric(&metric.Metric{
		Name:        fmt.Sprintf("%s_%d_payloads_out", proc.Name, proc.ID),
		Description: "keeps track of how many payloads the processor has outputted",
	})
	proc.Metric.AddMetric(&metric.Metric{
		Name:        fmt.Sprintf("%s_%d_payloads_in", proc.Name, proc.ID),
		Description: "keeps track of how many payloads the processor has inputted",
	})
	return proc
}

// Start will run a Processor and execute the given Handler on any incomming payloads
func (p *Processor) Start(ctx context.Context) error {
	// IsRunning? Skip
	if p.Running {
		return nil
	}
	// Validate Settings of Handler
	if p.Handler == nil {
		return ErrProcessorHasNoHandlerApplied
	}
	if ctx == nil {
		return ErrNilContext
	}

	if ok, _ := p.Handler.ValidateConfiguration(); !ok {
		return ErrRequiredPropertiesNotFulfilled
	}

	c, cancel := context.WithCancel(ctx)
	p.cancel = cancel

	if p.Handler.Subscriptionless() {
		go p.HandleSubscriptionless(c)
	} else {
		for _, sub := range p.subscriptions {
			go p.handleSubscription(c, sub)
		}
	}

	p.Running = true

	return nil
}

// Stop will cancel the goroutines running
func (p *Processor) Stop() error {
	if !p.Running {
		return ErrProcessorAlreadyStopped
	} else if p.cancel == nil {
		return ErrProcessorAlreadyStopped
	}
	p.cancel()
	p.Running = false
	return nil
}

// SetExecutionInterval is used customize how often to trigger an SelfPublishing Handler
func (p *Processor) SetExecutionInterval(interval time.Duration) {
	p.ExecutionInterval = interval
}

// GetConfiguration is just an reacher for Handlers getcfg
func (p *Processor) GetConfiguration() *property.Configuration {
	return p.Handler.GetConfiguration()
}

// SetID is a way to overwrite the generated ID, this is mostly used when Loading Processors from a Daisy file
func (p *Processor) SetID(i uint) {
	p.ID = i
}

// SetName will change the name of the processor
func (p *Processor) SetName(n string) {
	p.Name = n
}

// SetHandler will change the Handler the Processor performs on incomming payloads
// Should hot reloading like this be ok? Do we need to Stop / Start the proccessor after?
func (p *Processor) SetHandler(a handlers.Handler) {
	p.Handler = a
}

// HandleSubscriptionless is used to handle Handlers that has no requirement of subscriptions
// They will instead be triggerd by a Timer based on ExecutionInterval
func (p *Processor) HandleSubscriptionless(ctx context.Context) {
	ticker := time.NewTicker(p.ExecutionInterval)
	// Trigger the Handler to run once at startup aswell.
	payloads, err := p.Handler.Handle(nil)
	if err != nil {
		p.FailureHandler(Failure{
			Err:       err,
			Payload:   nil,
			Processor: p.ID,
		})
	}
	p.publishPayloads(payloads...)
	for {
		select {
		case <-ticker.C:
			payloads, err := p.Handler.Handle(nil)
			if err != nil {
				p.FailureHandler(Failure{
					Err:       err,
					Payload:   nil,
					Processor: p.ID,
				})
			}

			p.publishPayloads(payloads...)
		case <-ctx.Done():
			return
		}
	}
}

// Subscribe will subscribe to a certain topic and make the Processor
// Ingest its payloads into it
func (p *Processor) Subscribe(topics ...string) error {
	for _, sub := range p.subscriptions {
		for _, topic := range topics {
			if sub.Topic == topic {
				return ErrDuplicateTopic
			}
		}
	}
	for _, topic := range topics {
		pipe, err := pubsub.Subscribe(topic, p.ID, p.QueueSize)
		if err != nil {
			return err
		}
		p.Lock()
		p.subscriptions = append(p.subscriptions, pipe)
		p.Unlock()
	}
	return nil
}

// AddTopics will add Topics to publish onto
func (p *Processor) AddTopics(topics ...string) error {
	for _, topic := range topics {
		for _, currenttop := range p.Topics {
			if topic == currenttop {
				return ErrDuplicateTopic
			}
		}
	}
	p.Topics = append(p.Topics, topics...)
	return nil
}

// handleSubscription is used to spawn a gourtine that runs the
// assigned Handler on incomming payloads
func (p *Processor) handleSubscription(ctx context.Context, sub *pubsub.Pipe) {
	for {
		select {
		case payload := <-sub.Flow:
			p.Metric.IncrementMetric(fmt.Sprintf("%s_%d_payloads_in", p.Name, p.ID), 1)
			payloads, err := p.Handler.Handle(payload)
			if err != nil {
				p.FailureHandler(Failure{
					Err:       err,
					Payload:   payload,
					Processor: p.ID,
				})
			}

			p.publishPayloads(payloads...)
		case <-ctx.Done():
			return
		}
	}
}

// publishPayloads will itterate all topics and output the payloads
func (p *Processor) publishPayloads(payloads ...payload.Payload) {
	for _, payload := range payloads {
		for _, topic := range p.Topics {
			errors := pubsub.Publish(topic, payload)
			for _, err := range errors {
				p.FailureHandler(Failure{
					Err:       err.Err,
					Payload:   payload,
					Processor: p.ID,
				})
				continue
			}
			p.Metric.IncrementMetric(fmt.Sprintf("%s_%d_payloads_out", p.Name, p.ID), 1)

		}
	}
}

// ConvertToLoader is actually just a way too convert into a savable format
func (p *Processor) ConvertToLoader() *LoaderProccessor {
	// Convert Subscription pipelines into []string
	var subnames []string
	for _, sub := range p.subscriptions {
		subnames = append(subnames, sub.Topic)
	}
	return &LoaderProccessor{
		ID:                p.ID,
		ExecutionInterval: p.ExecutionInterval,
		Name:              p.Name,
		QueueSize:         p.QueueSize,
		Running:           p.Running,
		Topics:            p.Topics,
		Subscriptions:     subnames,
		Handler: LoaderHandler{
			Cfg:  p.Handler.GetConfiguration(),
			Name: p.Handler.GetHandlerName(),
		},
	}

}
