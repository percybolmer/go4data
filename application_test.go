package workflow

import (
	"errors"
	"testing"
	"time"
)

func TestAddWorkflow(t *testing.T) {
	testApp := NewApplication("Test")

	firstWorkflow := NewWorkflow("workflow1")

	err := testApp.AddWorkflow(firstWorkflow)
	if err != nil {
		t.Fatal(err)
	}

	err = testApp.AddWorkflow(firstWorkflow)
	if !errors.Is(err, ErrDuplicateName) {
		t.Fatal(err)
	}
}

func TestStartAndStopApplication(t *testing.T) {
	testApp := NewApplication("Test")

	firstWorkFlow := NewWorkflow("workflow1")

	err := testApp.AddWorkflow(firstWorkFlow)
	if err != nil {
		t.Fatalf("%s: Failed to initialize the Test properly", err.Error())
	}

	// What happens if we Start an Application before The workflow has any Proceessor?
	// We want nothing to happen
	// App should have nothing to do with starting logic since that befalls the Workflow and the Processors
	err = testApp.Start()
	if err != nil {
		t.Fatalf("%s: The start should have worked", err.Error())
	}

	// Add some Processing to the Workflow
	err = testApp.AddProcessor(&TestProcessor{Name: "Test1"}, "workflow::notexisting")
	if err == nil {
		t.Fatal("Should not been able to add processors to nonexisting workflow")
	}
	err = testApp.AddProcessor(&TestProcessor{Name: "Test1"}, "workflow1")
	if err != nil {
		t.Fatalf("%s: Should have been able to add Processor", err.Error())
	}
	time.Sleep(2 * time.Second)
	// No output should be given
	err = testApp.Start()
	if err != nil {
		t.Fatalf("%s: Should have correctly been able to start ", err.Error())
	}
	time.Sleep(3 * time.Second)
	// Stopping it
	testApp.Stop()
	// No outputs should come now
	time.Sleep(3 * time.Second)

}
