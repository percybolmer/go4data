package workflow

import (
	"errors"
	"io/ioutil"
	"os"
	"testing"
	"time"

	"github.com/percybolmer/workflow/failure"
	fileprocessors "github.com/percybolmer/workflow/processors/file-processors"
	"github.com/percybolmer/workflow/processors/processmanager"
	_ "github.com/percybolmer/workflow/processors/terminal-processors"
)

func TestFailingProcessor(t *testing.T) {
	w := NewWorkflow("testing")

	tp1 := &FailureProcessor{
		Name: "for testing",
	}

	w.AddProcessor(tp1)

	err := w.Start()
	if err != nil {
		t.Fatalf("Shouldnt have failed running this test start: %s", err.Error())
	}

	// Should be prints comming
	time.Sleep(5 * time.Second)
}
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
	if !errors.Is(err, failure.ErrIngressRelationshipNeeded) {
		t.Fatalf("Should have failed to start an Processor that needs an Ingress as a First Processor, %v", err)
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

	length := len(w.Processors)
	w.RemoveProcessor(1)
	if len(w.Processors) != length-1 {
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

func BenchmarkOverheadRaw(b *testing.B) {
	for n := 0; n < b.N; n++ {
		readparsewrite()
	}
}

func readparsewrite() error {
	file, err := os.Open("cmd/example/files/csv.txt")
	if err != nil {
		return err
	}
	defer file.Close()
	data, err := ioutil.ReadAll(file)
	if err != nil {
		return err
	}
	// steal parseCSV from processor since its completly clean from any workflow stuff
	proc := fileprocessors.NewParseCsv()

	csvrows, err := proc.Parse(data)
	if err != nil {
		return err
	}

	outputfile, err := os.OpenFile("/tmp/workflow-test.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer outputfile.Close()

	for _, row := range csvrows {
		_, err := outputfile.Write(row.GetPayload())
		if err != nil {
			return err
		}
	}

	return nil
}

func BenchmarkOverheadWorkflow(b *testing.B) {

	// Each item should return 2 rows so reset and finish after 2

	for n := 0; n < b.N; n++ {
		w := NewWorkflow("benchmark")

		readfile, err := processmanager.GetProcessor("ReadFile")
		if err != nil {
			b.Fatal(err)
		}
		readfile.SetProperty("path", "cmd/example/files/csv.txt")
		readfile.SetProperty("remove_after", false)
		parsecsv, err := processmanager.GetProcessor("ParseCsv")
		if err != nil {
			b.Fatal(err)
		}

		writefile, err := processmanager.GetProcessor("WriteFile")
		if err != nil {
			b.Fatal(err)
		}
		writefile.SetProperty("path", "/tmp/workflow-test.txt")
		writefile.SetProperty("append", true)
		w.AddProcessor(readfile, parsecsv, writefile)
		w.Start()
		for {
			for _, met := range writefile.GetMetrics() {
				if met.Name == "writes" {
					if met.Value == 2 {
						w.Stop()
						goto end
					}
				}
			}
		}

	end:
		break
	}

	os.Remove("/tmp/workflow-test.txt")

}
