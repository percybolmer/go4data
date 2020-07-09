package workflow

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/relationships"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/properties"
)

type TestProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  relationships.PayloadChannel
	egress   relationships.PayloadChannel
	failures relationships.FailurePipe
	*properties.PropertyMap
}

func (tp *TestProcessor) Initialize() error {
	tp.egress = make(relationships.PayloadChannel, 1000)
	return nil

}
func (tp *TestProcessor) IsRunning() bool {
	return tp.running
}
func (tp *TestProcessor) GetMetrics() []*metric.Metric {
	return nil
}
func (tp *TestProcessor) GetName() string {
	return "this is the name"
}
func (tp *TestProcessor) GetDescription() string {
	return "this is a test processor"
}

func (tp *TestProcessor) SetFailureChannel(fp relationships.FailurePipe) {
	tp.failures = fp
}
func (tp *TestProcessor) Start(ctx context.Context) error {
	if tp.running {
		return failure.ErrAlreadyRunning
	}
	go func() {
		tp.running = true
		c, cancel := context.WithCancel(ctx)
		tp.cancel = cancel
		timer := time.NewTicker(2 * time.Second)
		for {
			select {
			case <-timer.C:
				fmt.Println("Tick from ", tp.Name)

			case <-c.Done():
				return
			}
		}
	}()
	return nil
}

func (tp *TestProcessor) Stop() {
	if !tp.running {
		return
	}
	tp.running = false
	tp.cancel()
}

func (tp *TestProcessor) SetIngress(i relationships.PayloadChannel) {
	tp.ingress = i
}

func (tp *TestProcessor) GetEgress() relationships.PayloadChannel {
	return tp.egress
}

// TextForwardProcessor is soly fur testing purpose
type TextForwardProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  relationships.PayloadChannel
	egress   relationships.PayloadChannel
	failures relationships.FailurePipe
	*properties.PropertyMap
}

func (tp *TextForwardProcessor) Initialize() error {
	tp.egress = make(relationships.PayloadChannel, 1000)
	return nil
}

func (tp *TextForwardProcessor) GetName() string {
	return "this is the name"
}
func (tp *TextForwardProcessor) GetDescription() string {
	return "this is a failing processor"
}

func (tp *TextForwardProcessor) IsRunning() bool {
	return tp.running
}
func (tp *TextForwardProcessor) GetMetrics() []*metric.Metric {
	return nil
}
func (tp *TextForwardProcessor) SetFailureChannel(fp relationships.FailurePipe) {
	tp.failures = fp
}
func (tp *TextForwardProcessor) Start(ctx context.Context) error {
	if tp.running {
		return failure.ErrAlreadyRunning
	}
	if tp.egress == nil {
		tp.egress = make(chan payload.Payload, 1000)
	}
	go func() {
		tp.running = true

		c, cancel := context.WithCancel(ctx)
		tp.cancel = cancel
		timer := time.NewTicker(2 * time.Second)
		for {
			select {
			case <-timer.C:
				tp.egress <- payload.BasePayload{
					Source:  "TextForwardProcessor",
					Payload: []byte("Hello from: " + tp.Name),
				}
			case <-c.Done():
				return
			}
		}
	}()
	return nil
}

func (tp *TextForwardProcessor) Stop() {
	if !tp.running {
		return
	}
	tp.running = false
	tp.cancel()
}

func (tp *TextForwardProcessor) SetIngress(i relationships.PayloadChannel) {
	tp.ingress = i
}

func (tp *TextForwardProcessor) GetEgress() relationships.PayloadChannel {
	return tp.egress
}

// TextPrinterProcessor is soly fur testing purpose
type TextPrinterProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  relationships.PayloadChannel
	egress   relationships.PayloadChannel
	failures relationships.FailurePipe
	*properties.PropertyMap
}

func (tp *TextPrinterProcessor) Initialize() error {
	tp.egress = make(relationships.PayloadChannel, 1000)
	return nil
}
func (tp *TextPrinterProcessor) GetName() string {
	return "this is the name"
}
func (tp *TextPrinterProcessor) GetDescription() string {
	return "this is a failing processor"
}

func (tp *TextPrinterProcessor) IsRunning() bool {
	return tp.running
}
func (tp *TextPrinterProcessor) GetMetrics() []*metric.Metric {
	return nil
}
func (tp *TextPrinterProcessor) SetFailureChannel(fp relationships.FailurePipe) {
	tp.failures = fp
}

func (tp *TextPrinterProcessor) Start(ctx context.Context) error {
	if tp.running {
		return failure.ErrAlreadyRunning
	}
	if tp.ingress == nil {
		return failure.ErrIngressRelationshipNeeded
	}
	go func() {
		tp.running = true
		c, cancel := context.WithCancel(ctx)
		tp.cancel = cancel
		for {
			select {
			case payload := <-tp.ingress:
				fmt.Printf("%s", payload.GetPayload())
			case <-c.Done():
				return
			}
		}
	}()
	return nil
}

func (tp *TextPrinterProcessor) Stop() {
	if !tp.running {
		return
	}
	tp.running = false
	tp.cancel()
}

func (tp *TextPrinterProcessor) SetIngress(i relationships.PayloadChannel) {
	tp.ingress = i
}

func (tp *TextPrinterProcessor) GetEgress() relationships.PayloadChannel {
	return tp.egress
}

// FailureProcessor is soly fur testing purpose
type FailureProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  relationships.PayloadChannel
	egress   relationships.PayloadChannel
	failures relationships.FailurePipe
	*properties.PropertyMap
}

func (tp *FailureProcessor) Initialize() error {
	tp.egress = make(relationships.PayloadChannel, 1000)
	tp.PropertyMap = properties.NewPropertyMap()
	return nil
}

func (tp *FailureProcessor) GetName() string {
	return "this is the name"
}
func (tp *FailureProcessor) GetDescription() string {
	return "this is a failing processor"
}

func (tp *FailureProcessor) IsRunning() bool {
	return tp.running
}
func (tp *FailureProcessor) GetMetrics() []*metric.Metric {
	return nil
}
func (tp *FailureProcessor) SetFailureChannel(fp relationships.FailurePipe) {
	tp.failures = fp
}

func (tp *FailureProcessor) Start(ctx context.Context) error {
	go func() {
		for {
			tp.failures <- failure.Failure{
				Err:       errors.New("This is a new error"),
				Payload:   payload.BasePayload{Payload: []byte(`hej`)},
				Processor: tp.Name,
			}
			time.Sleep(1 * time.Second)
		}
	}()
	return nil
}

func (tp *FailureProcessor) Stop() {
	if !tp.running {
		return
	}
	tp.running = false
	tp.cancel()
}

func (tp *FailureProcessor) SetIngress(i relationships.PayloadChannel) {
	return
}

func (tp *FailureProcessor) GetEgress() relationships.PayloadChannel {
	return nil
}
