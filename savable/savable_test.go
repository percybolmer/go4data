package savable


import (
	"context"
	"github.com/percybolmer/workflow"
	"github.com/percybolmer/workflow/processors/processmanager"
	"testing"
	_ "github.com/percybolmer/workflow/processors/file-processors"
	"time"
)


func TestYAML_Load3(t *testing.T) {

		app := workflow.NewApplication("loadintothos")
		y := YAML{}
		err := y.Load("test.yaml", app)
		if err != nil {
			t.Fatal(err)
		}

		// Test functionallity of App
		err = app.Start()
		if err != nil {
			t.Fatal(err)
		}
		time.Sleep(1 * time.Second)
		for _, p := range app.Workflows["unusedflow"].Processors {
			for _, m := range  p.GetMetrics() {
				t.Logf("%s:%d", m.Name, m.Value)
			}

		}
}
func TestYAML_Load2(t *testing.T) {
	// Test loading a workflow
	wf := workflow.NewWorkflow("unsued")
	y  := YAML{}
	err := y.Load("workflow.yaml", wf)
	if err != nil {
		t.Fatal(err)
	}

	if len(wf.Processors) == 0 {
		t.Fatalf("Workflow should have more than 0 prorcessors: %v", wf)
	}

	if wf.Processors[0].GetProperty("filepath").String() != "/tmp/doesnotexist.123" {
		t.Fatal("Failed to load property")
	}

	// Now try starting the workflow, should generate 1 failure metric in ReadFile
	err = wf.Start()
	if err != nil {
		t.Fatal(err)
	}

	time.Sleep(1 * time.Second)
	m := wf.Processors[0].GetMetrics()
	if m == nil {
		t.Fatal("Metrics is nil")
	}
	for _, met := range m {
		if met.Value != 1 {
			t.Fatal("Failed to report error, did processor really run?")
		}
	}
}
func TestYAML_Load(t *testing.T) {

	// Test loading ReadProc
	readproc, _ := processmanager.GetProcessor("ReadFile")

	y  := YAML{}
	err := y.Load("readproc.yaml", readproc)
	if err != nil {
		t.Fatal(err)
	}
	for _, m := range  readproc.GetMetrics() {
		t.Logf("%s:%d", m.Name, m.Value)
	}

	err = readproc.Initialize()
	if err != nil {
		t.Fatal(err)
	}
	err = readproc.Start(context.TODO())
	if err != nil {
		t.Fatal(err)
	}
	time.Sleep(1 * time.Second)

	for _, m := range  readproc.GetMetrics() {
		if m.Value != 2 {
			t.Fatal("Should be 2 failures for this proc")
		}
	}
}

func TestYAML_Save(t *testing.T) {

	app := workflow.NewApplication("savethis")
	w := workflow.NewWorkflow("unusedflow")

	readproc, err := processmanager.GetProcessor("ReadFile")
	if err != nil {
		panic(err)
	}

	readproc.SetProperty("remove_after", false)
	readproc.SetProperty("filepath", "/tmp/doesnotexist.123")
	w.AddProcessor(readproc)
	app.AddWorkflow(w)


	app.Start()
	time.Sleep(1 * time.Second)
	mets := readproc.GetMetrics()
	if len(mets) == 0 {
		t.Fatal("Failed to add metric")
	}

	for _, m := range mets {
		t.Logf("%s:%d", m.Name, m.Value)
	}

	y := YAML{}
	err = y.Save("workflow.yaml" , app)
	if err != nil {
		t.Fatal(err)
	}
}