package fileprocessors

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/percybolmer/workflow/failure"
)

func TestListDirectory_Initialize(t *testing.T) {
	proc := NewListDirectory()
	// Empty Init should fail
	err := proc.Initialize()
	if err == nil {
		t.Fatal("Should have failed to initialize without proper Properties set")
	}
	proc.SetProperty("test_prop", true)
	err = proc.Initialize()
	if err != nil {
		t.Fatalf("Should have passed initialize now that all properties are there: %s", err.Error())
	}

}

func TestListDirectory_Start(t *testing.T) {
	proc := NewListDirectory()

	proc.SetProperty("path", "testfiles")

	err := proc.Initialize()
	if err != nil {
		t.Fatal(err)
	}

	endtimer := time.NewTicker(12 * time.Second)
	for {
		select {
		case file := <-proc.egress:
			t.Log(file)
		case <-endtimer.C:
			return
		}
	}
}

func TestListDirectory_StopStart(t *testing.T) {
	proc := NewListDirectory()

	if proc.IsRunning() {
		t.Fatal("proccessor should not be running after creation")
	}

	err := proc.Start(context.TODO())
	if err != nil {
		t.Fatal("processor should not have failed to startup")
	}
	err = proc.Start(context.TODO())
	if !errors.Is(err, failure.ErrAlreadyRunning) {
		t.Fatal("processor should have reported already running")
	}

	proc.Stop()
	err = proc.Start(context.TODO())
	if err != nil {
		t.Fatal("a restart should have been able to run")
	}
}
