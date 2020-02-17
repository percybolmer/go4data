package workflow

import (
	"encoding/json"
	"io/ioutil"
	"sync"
	"time"

	"github.com/percybolmer/workflow/statistics"

	"github.com/percybolmer/workflow/flow"
)

// Application is a container for workflows
type Application struct {
	Name  string      `json:"application"`
	Flows []*Workflow `json:"workflows"`
}

// NewApplication will return a pointer to a freshly inited Application
func NewApplication(name string) *Application {
	return &Application{
		Name:  name,
		Flows: make([]*Workflow, 0),
	}
}

// AddWorkFlow is used to add a workflow into the application
func (a *Application) AddWorkFlow(w *Workflow) {
	a.Flows = append(a.Flows, w)
}

// NewApplicationFromFile will return a pointer to a freshly intied application
// based on a workflow config file, see the
// exampleflows at percybolmer/workflow/exampleflows
func NewApplicationFromFile(path string) (*Application, error) {
	a := &Application{
		Flows: make([]*Workflow, 0),
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
	var config Application
	err = json.Unmarshal(workfile, &config)
	if err != nil {
		return err
	}
	// TODO go through all configs properly and add all Flows and Init statistics
	// Quick and Dirty way to Init all Flows, Loading the Config works fine, but Channels and others are not
	// correctly inited that way, this way we will create a NewFlow for each flow in the config to correct that
	for _, configWorkflows := range config.Flows {
		// See if statistics is configured, if not it will set the default Value as duration
		// If the processors does not have a Duration config set, it will use the workflows
		var statDuration time.Duration
		if configWorkflows.Statistics != nil && configWorkflows.Statistics.Duration != 0 {
			// Convert input to seconds
			statDuration = configWorkflows.Statistics.Duration * time.Second
		}
		newWorkFlow := &Workflow{
			Name:       configWorkflows.Name,
			LogPath:    configWorkflows.LogPath,
			Statistics: statistics.NewStatistics(statDuration),
		}

		for _, processor := range configWorkflows.Processors {
			// Handle each Processor separate, if no duration is set then use the same as the workflow has
			var procStatDur time.Duration
			if processor.Statistics != nil && processor.Statistics.Duration != 0 {
				procStatDur = processor.Statistics.Duration * time.Second
			} else {
				procStatDur = statDuration
			}
			newFlow := flow.NewFlow(processor.ProcessorName, nil, processor.Configuration, procStatDur)
			newWorkFlow.AddFlow(newFlow)
		}
		a.AddWorkFlow(newWorkFlow)
	}

	return nil
}
