package terminalprocessors

import (
    "github.com/percybolmer/workflow/relationships"
    "testing"
    "context"
    "errors"
    "github.com/percybolmer/workflow/failure"
)

func TestStdout_Initialize(t *testing.T) {
    proc := NewStdout()
    // Empty Init should fail
    proc.AddRequirement("test_prop")
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

func TestStdout_StopStart(t *testing.T){
    proc := NewStdout()


    if proc.IsRunning(){
        t.Fatal("proccessor should not be running after creation")
    }

    proc.SetIngress(make(relationships.PayloadChannel))
    err := proc.Start(context.TODO())
    if err != nil {
        t.Fatal("processor should not have failed to startup: ", err)
    }


    err = proc.Start(context.TODO())
    if !errors.Is(err, failure.ErrAlreadyRunning) {
        t.Fatal("processor should have reported already running: ", err)
    }

    proc.Stop()
    err = proc.Start(context.TODO())
    if err != nil {
        t.Fatal("a restart should have been able to run")
    }
}