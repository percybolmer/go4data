package workflow

import (
	"errors"
	"sync"

	"github.com/percybolmer/workflow/processors"
)

var (
	//ErrDuplicateName is thrown when trying to add a Workflow to an Application with a name that is already registerd
	ErrDuplicateName = errors.New("There is already an workflow with that name in the the application")
	//ErrNotStarted is when trying to cancel a not started processor
	ErrNotStarted = errors.New("Cannot stop an processor that is not running")
	//ErrWorkflowNotFound is when no Workflow with an name is not found
	ErrWorkflowNotFound = errors.New("No workflow with that given name is found")
)

// Application is a struct that holds many Workflows.
// @see Workflow to know what that means
// THe application is just a container for many Workflows that can be run / stopped
type Application struct {
	Name      string               `json:"name" yaml:"name"`
	Workflows map[string]*Workflow `json:"workflows" yaml:"workflows"`
	sync.RWMutex `json:"-" yaml: "-"`
}

// NewApplication will create a new Application with fresh settings and all values needed initialized
func NewApplication(name string) *Application {
	return &Application{
		Name:      name,
		Workflows: make(map[string]*Workflow, 0),
	}
}

// AddWorkflow is used to add a new Workflow to the Application
// It will throw an error if you try to add a workflow that already exists inside the Application
func (a *Application) AddWorkflow(w *Workflow) error {
	if _, ok := a.Workflows[w.Name]; ok {
		return ErrDuplicateName
	}
	a.Lock()
	defer a.Unlock()
	a.Workflows[w.Name] = w
	return nil
}

// AddProcessor is used to add an Processor to an given Workflow
func (a *Application) AddProcessor(p processors.Processor, workflowName string) error {
	if _, ok := a.Workflows[workflowName]; !ok {
		return ErrWorkflowNotFound
	}
	a.Workflows[workflowName].AddProcessor(p)
	return nil
}

// Start will trigger the all the Workflows to run Start on all the Processors
func (a *Application) Start() error {
	for _, w := range a.Workflows {
		err := w.Start()
		if err != nil {
			return err
		}
	}
	return nil
}

// Stop will trigger all worksflows confiugred to be stopped
func (a *Application) Stop() {
	for _, w := range a.Workflows {
		w.Stop()
	}
}

