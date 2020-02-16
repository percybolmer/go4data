package workflow

import (
	"encoding/json"
	"io/ioutil"
	"sync"

	"github.com/percybolmer/workflow/statistics"

	"github.com/percybolmer/workflow/flow"
)

// Application is a container for workflows
type Application struct {
	Name  string     `json:"application"`
	Flows []Workflow `json:"workflows"`
}

// NewApplication will return a pointer to a freshly inited Application
func NewApplication(name string) *Application {
	return &Application{
		Name:  name,
		Flows: make([]Workflow, 0),
	}
}

// NewApplicationFromFile will return a pointer to a freshly intied application
// based on a workflow config file, see the
// exampleflows at percybolmer/workflow/exampleflows
func NewApplicationFromFile(path string) (*Application, error) {
	a := &Application{
		Flows: make([]Workflow, 0),
	}
	err := a.LoadWorkflowFile(path)
	if err != nil {
		return nil, err
	}
	return a, nil

}

// Run will start an Application and all its Flows
func (a *Application) Run() {
	var wg sync.WaitGroup
	for _, flow := range a.Flows {
		flow.Start(&wg)
	}
	// Wait until all Flows are upp and Running
	wg.Wait()
}

//LoadWorkflowFile is used to get the workflow file and unmarshal it
// will panic since the workflow file is a needed element to actually run the program
func (a *Application) LoadWorkflowFile(path string) error {
	workfile, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}

	err = json.Unmarshal(workfile, a)
	if err != nil {
		return err
	}
	// TODO go through all configs properly and add all Flows and Init statistics
	// Quick and Dirty way to Init all Flows, Loading the Config works fine, but Channels and others are not
	// correctly inited that way, this way we will create a NewFlow for each flow in the config to correct that
	for _, f := range a.Flows {
		f.Statistics = statistics.NewStatistics()
		for _, fl := range f.Processors {
			fl = flow.NewFlow(fl.ProcessorName, nil, fl.Configuration)
		}
	}
	return nil
}
