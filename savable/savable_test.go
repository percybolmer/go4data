package savable


import (
	"github.com/percybolmer/workflow"
	"github.com/percybolmer/workflow/processors/processmanager"
	"testing"
	_ "github.com/percybolmer/workflow/processors/file-processors"
	"time"
)



func TestYAML_Save(t *testing.T) {
	y := YAML{
		path: "test.yaml",
	}

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


	err = y.Save(app)
	if err != nil {
		t.Fatal(err)
	}
}