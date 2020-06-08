package properties

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"github.com/percybolmer/workflow"
)

// Property testing
type PropertyProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  workflow.Relationship
	egress   workflow.Relationship
	failures workflow.FailurePipe
	PropertyMap
	somefield string
}

func (tp *PropertyProcessor) Initialize() error {
	tp.egress = make(workflow.Relationship, 1000)

	someConfig := tp.GetProperty("needed_value")
	if someConfig == nil {
		return errors.New("This processor is missing some value thats needed")
	}

	tp.somefield = someConfig.String()

	return nil
}

func (tp *PropertyProcessor) IsRunning() bool {
	return tp.running
}

func (tp *PropertyProcessor) SetFailureChannel(fp workflow.FailurePipe) {
	tp.failures = fp
}

func (tp *PropertyProcessor) Start(ctx context.Context) error {
	// Initialize is meant to setup the procesor before start, it should have been run by the workflow,
	// avoid making initializations inside start.
	fmt.Println(tp.somefield)
	return nil
}

func (tp *PropertyProcessor) Stop() {
	if !tp.running {
		return
	}
	tp.running = false
	tp.cancel()
}

func (tp *PropertyProcessor) SetIngress(i workflow.Relationship) {
	return
}

func (tp *PropertyProcessor) GetEgress() workflow.Relationship {
	return nil
}

func TestAddingRemovingProperties(t *testing.T) {
	p := &PropertyProcessor{
		Name: "testing",
	}

	dontPanic := p.GetProperty("non")
	if dontPanic != nil {
		t.Fatal("Something is wrong, should be nil")
	}

	p.SetProperty("someConfig", "123123")

	something := p.GetProperty("someConfig")

	if something == nil {
		t.Fatal("Should have found a Property")
	}

	p.RemoveProperty("someConfig")

	s2 := p.GetProperty("someConfig")
	if s2 != nil {
		t.Fatal("Shouldnt have found any config after removal")
	}
	t.Logf(something.Value.(string))
}

func TestReflection(t *testing.T) {
	p := &PropertyProcessor{
		Name: "Testing",
	}

	p.SetProperty("integer", 10)

	p.SetProperty("string", "HelloWorld")

	intProp := p.GetProperty("integer")
	strProp := p.GetProperty("string")

	_, _ = intProp.Int()
	_ = strProp.String()

	intAsString := intProp.String()

	t.Log(intAsString)

}
