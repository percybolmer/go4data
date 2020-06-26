package workflow

import (
	"context"
	"errors"
	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/processors/processmanager"
	"github.com/percybolmer/workflow/properties"
	"github.com/percybolmer/workflow/relationships"
	"gopkg.in/yaml.v3"
	"sync"

	"github.com/percybolmer/workflow/processors"
)


var (
	// ErrFailedToUnmarshal is thrown when trying to unmarhsla workflows but it fails
	ErrFailedToUnmarshal = errors.New("failed to unmarshal since data provided is not correct")
)
// Workflow is a chain of processors to run.
// It will run processors created in the order they are set.
type Workflow struct {
	Name string `json:"name" yaml:"name"`
	// processors is the array containing all processors that has been added to the Workflow.
	Processors []processors.Processor `json:"children" yaml:"processors"`
	// ctx is a context passed by the current Application the workflow is added to
	ctx            context.Context `json:"-" yaml:"-"`
	failures       relationships.FailurePipe `json:"-" yaml:"-"`
	failureHandler func(f failure.Failure) `json:"-" yaml:"-"`
	failureStop    context.CancelFunc `json:"-" yaml:"-"`
	sync.Mutex `json:"-" yaml:"-"`
}

// NewWorkflow will initiate a new workflow
func NewWorkflow(name string) *Workflow {
	return &Workflow{
		Name:           name,
		Processors:     make([]processors.Processor, 0),
		failures:       make(relationships.FailurePipe, 1000),
		failureHandler: failure.PrintFailure,
	}
}

// AddProcessor will append a new processor at the end of the flow
func (w *Workflow) AddProcessor(p ...processors.Processor) {
	w.Lock()
	defer w.Unlock()
	w.Processors = append(w.Processors, p...)

}

// RemoveProcessor will remove an Processor from the Workflow
// Note that you will need to Restart the Workflow inorder for the Flow to work properly after removing an processor
func (w *Workflow) RemoveProcessor(i int) {
	w.Lock()
	defer w.Unlock()
	w.Processors = append(w.Processors[:i], w.Processors[i+1:]...)
}

// SetFailureHandler is used to change the current Error Handler used by the workflow
// will requier a restart to take action
func (w *Workflow) SetFailureHandler(f func(f failure.Failure)) {
	w.Lock()
	defer w.Unlock()
	w.failureHandler = f
}

// startFailureHandler is used to start the currently assigned Failure Handler for that workflow
func (w *Workflow) startFailureHandler(c context.Context) {
	if w.failures == nil || w.failureHandler == nil {
		return
	}
	ctx, cancel := context.WithCancel(c)
	w.failureStop = cancel
	go func() {
		for {
			select {
			case f := <-w.failures:
				w.failureHandler(f)
			case <-ctx.Done():
				return
			}
		}
	}()
}

// initializeAllProcessors will itterate all current processors and initialize all Unstarted processors
func (w *Workflow) initializeAllProcessors() error {
	for _, p := range w.Processors {
		if !p.IsRunning() {
			err := p.Initialize()
			if err != nil {
				return err
			}
		}
	}
	return nil
}

// Start will itterate all Processors and start them up
func (w *Workflow) Start() error {
	if w.ctx == nil {
		// Nil context, meaning this is not part of an application
		w.ctx = context.TODO()
	}
	w.startFailureHandler(w.ctx)
	err := w.initializeAllProcessors()
	if err != nil {
		return err
	}
	for i, p := range w.Processors {
		// If Processor is already running, skip starting it
		if p.IsRunning() {
			continue
		}

		p.SetFailureChannel(w.failures)
		// Add the Previous Processors Egress as the Ingress
		// There is no Previous Processor for Index 0 , so only on bigger than 0
		if i != 0 {
			w.Lock()
			ingress := w.Processors[i-1].GetEgress()
			if ingress != nil {
				p.SetIngress(ingress)
			}
			w.Unlock()
		}
		if err := p.Start(w.ctx); err != nil {
			return err
		}
	}

	return nil
}

// Stop will itterate all Processors and stop them
func (w *Workflow) Stop() {
	for _, p := range w.Processors {
		if p.IsRunning() {
			p.Stop()
		}
	}
	w.failureStop()
}

func (w *Workflow) UnmarshalYAML(value *yaml.Node) error {
	if len(value.Content) < 1 {
		return ErrFailedToUnmarshal
	}
	if value.Content[0].Value != "name" {
		return ErrFailedToUnmarshal
	}else {
		w.Name = value.Content[1].Value
	}
	var processorStart bool
	for _, node := range value.Content{
		if node.Value == "processors" {
			processorStart = true
			continue
		}
		if processorStart{
			for _ , procNode := range node.Content{
				// These are processor info, so procNode should be unmarshalled Into the correct struct, get the Name of the Processor and use processManager to fetch it
				// Name should be the Value of the element after the Node with value name
				var procName string
				var namenext bool
				var propnext bool
				//var metricnext bool
				var propmap properties.PropertyMap
				//var metricNode metric.Metrics
				for _, proc := range procNode.Content{
					if proc.Value == "name" {
						namenext = true
						continue
					} else if proc.Value == "properties" {
						propnext = true
						continue
					}/* else if proc.Value == "metrics" {
						metricnext = true
						continue
					}*/
					if namenext{
						procName = proc.Value
						namenext = false
					} else if propnext {
						err := proc.Decode(&propmap)
						if err != nil {
							return err
						}
						propnext = false
					}/*else if metricnext{
						err := proc.Decode(&metricNode)
						if err != nil {
							return err
						}
						metricnext = false
					}*/
				}
				p, err := processmanager.GetProcessor(procName)
				if err != nil {
					return err
				}
				for _, prop := range propmap.Properties {
					p.SetProperty(prop.Name, prop.Value)
				}
				w.AddProcessor(p)
			}

		}
	}
	return nil
}