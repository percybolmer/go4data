package terminalprocessors

import (
    "fmt"
    "github.com/percybolmer/workflow/payload"
    "github.com/percybolmer/workflow/properties"
    "github.com/percybolmer/workflow/relationships"
    "testing"
    "context"
    "errors"
    "github.com/percybolmer/workflow/failure"
    "time"
)

// Used for testing Ingress based EXEC Commands
// For Single exec see Exec1
// For Interval see Exec2
func TestExecCmd_Exec3(t *testing.T) {
    proc := NewExecCmd()

    arguments := make([]string, 0)
    arguments = append(arguments, "hello ", "payload")
    proc.SetProperty("command", "echo")
    proc.SetProperty("arguments", arguments)

    err := proc.Initialize()
    if err != nil {
        t.Fatal("Should not have failed to initialize with arguments")
    }
    // ingress needed should be true
    if !proc.needingress {
        t.Fatal("Needingress should be true since we have a payload argument")
    }

    ingress := make(relationships.PayloadChannel)
    proc.SetIngress(ingress)
    err = proc.Start(context.TODO())
    if err != nil {
        t.Fatal("Should not have failed to start Processor")
    }
    sender := time.NewTicker(1 * time.Second)
    closer := time.NewTicker(4 * time.Second)
    expected := 3
    gotten := make([]payload.Payload,0)
    for {
        select {
        case <- closer.C:
            return
        case result := <- proc.GetEgress():
            gotten = append(gotten, result)
            case <- sender.C:
                ingress <- payload.BasePayload{
                    Payload: []byte("hello"),
                    Source:  "sender",
                }
        }
    }

    if len(gotten) != expected {
        t.Fatal("GOt the wrong amount of expected payloads")
    }


}

// Used for testing Interval based EXEC Commands
// For Single exec see Exec1
// For ingress see Exec3
func TestExecCmd_Exec2(t *testing.T) {
    proc := NewExecCmd()

    arguments := make([]string, 0)
    arguments = append(arguments, "hello world")
    proc.SetProperty("interval", 0.5)
    proc.SetProperty("command", "echo")
    proc.SetProperty("arguments", arguments)
    err := proc.Initialize()
    if err != properties.ErrWrongPropertyType{
        t.Fatal("Got the wrong error, should be that interval is the wrong type")
    }
    proc.SetProperty("interval", 1)
    err = proc.Initialize()
    if err != nil {
        t.Fatal("Should not have failed to initialize with arguments")
    }

    err = proc.Start(context.TODO())
    if err != nil {
        t.Fatal("Should not have failed to start Processor")
    }

    closer := time.NewTicker(3 * time.Second)
    expected := 2
    gotten := make([]payload.Payload,0)
    for {
        select {
        case <- closer.C:
            return
        case result := <- proc.GetEgress():
            gotten = append(gotten, result)
        }
    }

    if len(gotten) != expected {
        t.Fatal("GOt the wrong amount of expected payloads")
    }


}
// Used for testing SINGLE EXEC Commands
// For interval see Exec2
// For ingress see Exec3
func TestExecCmd_Exec(t *testing.T) {
    proc := NewExecCmd()

    arguments := make([]string, 0)
    arguments = append(arguments, "hello world")
    proc.SetProperty("command", "echo")
    proc.SetProperty("arguments", arguments)
    err := proc.Initialize()
    if err != nil {
        t.Fatal("Should not have failed to initialize with arguments")
    }

    err = proc.Start(context.TODO())
    if err != nil {
        t.Fatal("Should not have failed to start Processor")
    }

    closer := time.NewTicker(1 * time.Second)
    for {
        select {
            case <- closer.C:
                return
                case result := <- proc.GetEgress():
                    fmt.Printf("payload is: %s", result.GetPayload())
        }
    }


}

func TestExecCmd_Initialize2(t *testing.T) {
    proc := NewExecCmd()

    arguments := make([]string,0)
    arguments = append(arguments, "world")
    proc.SetProperty("command", "hello")
    proc.SetProperty("arguments", arguments)
    err := proc.Initialize()
    if err != nil {
        t.Fatal("Should not have failed to initialize with arguments")
    }
    if proc.needingress {
        t.Fatal("ingress needed was set to true even tho arguments didnt contain a payload arg")
    }
    if len(proc.arguments) != 1 {
        t.Fatal("Failed to read arguments slice")
    }
    arguments = append(arguments, "payload")
    proc.SetProperty("arguments", arguments)

    err = proc.Initialize()
    if err != nil {
        t.Fatal("Failed to init second time")
    }

    if !proc.needingress{
        t.Fatal("failed to set needingress to true when payload is present")
    }


}
func TestExecCmd_Initialize(t *testing.T) {
    proc := NewExecCmd()
    // Empty Init should fail
    proc.AddRequirement("test_prop")
    err := proc.Initialize()
    if err == nil {
        t.Fatal("Should have failed to initialize without proper Properties set")
    }
    proc.SetProperty("test_prop", true)
    proc.SetProperty("command", "hello")
    proc.SetProperty("ingress_needed", true)
    err = proc.Initialize()
    if err != nil {
        t.Fatalf("Should have passed initialize now that all properties are there: %s", err.Error())
    }

}

func TestExecCmd_StopStart(t *testing.T){
    proc := NewExecCmd()


    if proc.IsRunning(){
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