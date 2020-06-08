package workflow

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/percybolmer/workflow/properties"
)

type TestProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  Relationship
	egress   Relationship
	failures FailurePipe
	*properties.PropertyMap
}

func (tp *TestProcessor) Initialize() error {
	tp.egress = make(Relationship, 1000)
	return nil
}
func (tp *TestProcessor) IsRunning() bool {
	return tp.running
}

func (tp *TestProcessor) SetFailureChannel(fp FailurePipe) {
	tp.failures = fp
}
func (tp *TestProcessor) Start(ctx context.Context) error {
	if tp.running {
		return ErrAlreadyRunning
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

func (tp *TestProcessor) SetIngress(i Relationship) {
	tp.ingress = i
}

func (tp *TestProcessor) GetEgress() Relationship {
	return tp.egress
}

// TextForwardProcessor is soly fur testing purpose
type TextForwardProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  Relationship
	egress   Relationship
	failures FailurePipe
	*properties.PropertyMap
}

func (tp *TextForwardProcessor) Initialize() error {
	tp.egress = make(Relationship, 1000)
	return nil
}

func (tp *TextForwardProcessor) IsRunning() bool {
	return tp.running
}
func (tp *TextForwardProcessor) SetFailureChannel(fp FailurePipe) {
	tp.failures = fp
}
func (tp *TextForwardProcessor) Start(ctx context.Context) error {
	if tp.running {
		return ErrAlreadyRunning
	}
	if tp.egress == nil {
		tp.egress = make(chan Payload, 1000)
	}
	go func() {
		tp.running = true

		c, cancel := context.WithCancel(ctx)
		tp.cancel = cancel
		timer := time.NewTicker(2 * time.Second)
		for {
			select {
			case <-timer.C:
				tp.egress <- BasePayload{
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

func (tp *TextForwardProcessor) SetIngress(i Relationship) {
	tp.ingress = i
}

func (tp *TextForwardProcessor) GetEgress() Relationship {
	return tp.egress
}

// TextPrinterProcessor is soly fur testing purpose
type TextPrinterProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  Relationship
	egress   Relationship
	failures FailurePipe
	*properties.PropertyMap
}

func (tp *TextPrinterProcessor) Initialize() error {
	tp.egress = make(Relationship, 1000)
	return nil
}

func (tp *TextPrinterProcessor) IsRunning() bool {
	return tp.running
}

func (tp *TextPrinterProcessor) SetFailureChannel(fp FailurePipe) {
	tp.failures = fp
}

func (tp *TextPrinterProcessor) Start(ctx context.Context) error {
	if tp.running {
		return ErrAlreadyRunning
	}
	if tp.ingress == nil {
		return ErringressRelationshipNeeded
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

func (tp *TextPrinterProcessor) SetIngress(i Relationship) {
	tp.ingress = i
}

func (tp *TextPrinterProcessor) GetEgress() Relationship {
	return tp.egress
}

// FailureProcessor is soly fur testing purpose
type FailureProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  Relationship
	egress   Relationship
	failures FailurePipe
	*properties.PropertyMap
}

func (tp *FailureProcessor) Initialize() error {
	tp.egress = make(Relationship, 1000)
	tp.PropertyMap = properties.NewPropertyMap()
	return nil
}

func (tp *FailureProcessor) IsRunning() bool {
	return tp.running
}

func (tp *FailureProcessor) SetFailureChannel(fp FailurePipe) {
	tp.failures = fp
}

func (tp *FailureProcessor) Start(ctx context.Context) error {
	go func() {
		for {
			tp.failures <- Failure{
				Err:       errors.New("This is a new error"),
				Payload:   BasePayload{Payload: []byte(`hej`)},
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

func (tp *FailureProcessor) SetIngress(i Relationship) {
	return
}

func (tp *FailureProcessor) GetEgress() Relationship {
	return nil
}
