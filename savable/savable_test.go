package savable


import (
	"github.com/percybolmer/workflow"
	"github.com/percybolmer/workflow/processors/processmanager"
	_ "github.com/percybolmer/workflow/processors/file-processors"
	"testing"
)



func TestYAML_Save(t *testing.T) {
	y := JSON{
		path: "test.json",
	}

	app := workflow.NewApplication("savethis")
	w := workflow.NewWorkflow("unusedflow")

	readproc, err := processmanager.GetProcessor("ReadFile")
	if err != nil {
		panic(err)
	}
	w.AddProcessor(readproc)
	app.AddWorkflow(w)


	err = y.Save(app)
	if err != nil {
		t.Fatal(err)
	}
}