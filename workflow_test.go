package workflow

import (
	"errors"
	"testing"
	"time"
)

func TestIngressAndEgress(t *testing.T) {
	w := NewWorkflow("testing")

	tp1 := &TextForwardProcessor{
		Name: "FirstProcessor",
	}
	tp2 := &TextPrinterProcessor{
		Name: "SecondProcessor",
	}

	w.AddProcessor(tp2)
	err := w.Start()
	if !errors.Is(err, ErringressRelationshipNeeded) {
		t.Fatal("Should have failed to start an Processor that needs an Ingress as a First Processor")
	}

	w.RemoveProcessor(0)
	w.AddProcessor(tp1)
	w.AddProcessor(tp2)

	err = w.Start()
	if err != nil {
		t.Fatalf("Error should have been nil: %s", err)
	}

	time.Sleep(6 * time.Second)
}

func TestRemoveProcessor(t *testing.T) {
	w := NewWorkflow("testing")

	tp1 := &TextPrinterProcessor{
		Name: "First",
	}
	tp2 := &TextPrinterProcessor{
		Name: "SecondProcessor",
	}
	tp3 := &TextPrinterProcessor{
		Name: "Third",
	}

	w.AddProcessor(tp1)
	w.AddProcessor(tp2)
	w.AddProcessor(tp3)

	length := len(w.processors)
	w.RemoveProcessor(1)
	if len(w.processors) != length-1 {
		t.Fatal("Didnt properly remove the processor")
	}

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
