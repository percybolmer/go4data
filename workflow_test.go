package workflow

import (
	"context"
	"fmt"
	"testing"
	"time"
)

type TestProcessor struct {
	Name    string
	running bool
	cancel  context.CancelFunc
}

func (tp *TestProcessor) IsRunning() bool {
	return tp.running
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
func TestStartAndStop(t *testing.T) {
	w := NewWorkflow("tjottahej")

	tp := &TestProcessor{
		Name: "Hejsan",
	}

	w.AddProcessor(tp)

	w.Start()

	time.Sleep(5 * time.Second)

	w.Stop()

	time.Sleep(3 * time.Second)
	t.Log("Starting duplucate Starts")
	err := w.Start()
	if err != nil {
		t.Fatal("Should have been able to start the workflow")
	}

	err = w.Start()
	if err != nil {
		t.Fatal(err.Error())
	}

	time.Sleep(6 * time.Second)
}
