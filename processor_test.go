package workflow

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/perbol/workflow/actions/files"
	"github.com/perbol/workflow/actions/filters"
	"github.com/perbol/workflow/actions/parsers"
	"github.com/perbol/workflow/actions/terminal"
	"github.com/perbol/workflow/pubsub"
	"github.com/percybolmer/workflow/payload"
)

func TestNewProcessor(t *testing.T) {

	p1 := NewProcessor("test")

	if p1.ID != 1 {
		t.Fatal("First id should be 1")
	}

	p2 := NewProcessor("test")
	if p2.ID != 2 {
		t.Fatal("Second ID should be 2")
	}
}

func TestStart(t *testing.T) {
	// Register Printer
	// Reset Register
	testf := terminal.NewStdoutAction()
	cfg := testf.GetConfiguration()
	// Add Properties here to test failure of them
	cfg.AddProperty("test", "testing", true)
	p := NewProcessor("test")

	err := p.Start(nil)
	if !errors.Is(err, ErrProcessorHasNoActionApplied) {
		t.Fatal(err)
	}
	p.SetAction(testf)
	err = p.Start(nil)
	if !errors.Is(err, ErrNilContext) {
		t.Fatal(err)
	}
	// Invalid Properties
	err = p.Start(context.Background())
	if !errors.Is(err, ErrRequiredPropertiesNotFulfilled) {
		t.Fatal(err)
	}

	cfg.SetProperty("test", true)
	err = p.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}
}

func TestPubSub(t *testing.T) {

	testf := terminal.NewStdoutAction()
	printer := NewProcessor("testf")
	printer.SetAction(testf)
	printer.Subscribe("testtopic")
	err := printer.Start(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	// Register Sender and Printer to topics
	sender := NewProcessor("test", "testtopic", "topicthatbuffers")
	// Now everything is setup, What sender sends will be printed by Printer
	sender.publishPayloads(payload.BasePayload{
		Source:  "Test",
		Payload: []byte(`Hello world`),
	})
	time.Sleep(1 * time.Second)
	metricName := fmt.Sprintf("%s_%d_payloads_in", printer.Name, printer.ID)
	printerMetric := printer.Metric.GetMetrics()
	if printerMetric[metricName].Value != 1 {
		t.Fatal("Wrong Printer metric value")
	}

	printer2 := NewProcessor("bufferProcessor")
	printer2.SetAction(testf)
	printer2.Subscribe("topicthatbuffers")

	printer2.Start(context.Background())
	if len(pubsub.Topics["topicthatbuffers"].Buffer.Flow) != 1 {
		t.Fatal("Wrong buffer length in topicthatbuffers")
	}
	pubsub.DrainTopicsBuffer()
	time.Sleep(1 * time.Second)
	metricName = fmt.Sprintf("%s_%d_payloads_in", printer2.Name, printer2.ID)
	printerMetric = printer2.Metric.GetMetrics()
	if printerMetric[metricName].Value != 1 {
		t.Fatal("Wrong Printer2 metric value")
	}

}

func TestRealLifeCase(t *testing.T) {
	// The idea here is to test a case of how it could be used by others
	listDirProc := NewProcessor("listdir", "found_files")
	readFileProc := NewProcessor("readfile", "file_data")
	csvReader := NewProcessor("csvReader", "map_reduce")
	MapFilter := NewProcessor("mapfilter", "print_stdout")
	printerProc := NewProcessor("printer", "printer_output")
	printer2Proc := NewProcessor("printer2")
	listDirProc.SetAction(files.NewListDirectoryAction())
	printerProc.SetAction(terminal.NewStdoutAction())
	printer2Proc.SetAction(terminal.NewStdoutAction())
	readFileProc.SetAction(files.NewReadFileAction())
	csvReader.SetAction(parsers.NewParseCSVAction())
	MapFilter.SetAction(filters.NewMapFilterAction())
	// Setup configurations - still a bit clonky, but LoadConfig should be impl soon
	cfg := listDirProc.GetConfiguration()
	err := cfg.SetProperty("path", "testing")
	if err != nil {
		t.Fatal(err)
	}
	err = cfg.SetProperty("buffertime", 2)
	if err != nil {
		t.Fatal(err)
	}
	listDirProc.SetExecutionInterval(1 * time.Second)
	printerProc.GetConfiguration().SetProperty("forward", true)
	readFileProc.GetConfiguration().SetProperty("remove_after", false)
	MapFilter.GetConfiguration().SetProperty("filters", map[string]string{"username": "perbol"})
	MapFilter.GetConfiguration().SetProperty("strict", true)
	// Fix Relationships
	readFileProc.Subscribe("found_files")
	csvReader.Subscribe("file_data")
	MapFilter.Subscribe("map_reduce")
	printerProc.Subscribe("print_stdout")
	printer2Proc.Subscribe("printer_output")

	// Startup
	if err := listDirProc.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := readFileProc.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := csvReader.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := MapFilter.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := printer2Proc.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := printerProc.Start(context.Background()); err != nil {
		t.Fatal(err)
	}

	time.Sleep(5 * time.Second)
}
