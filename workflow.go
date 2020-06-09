package workflow

import (
	"context"
	"sync"

	"github.com/percybolmer/workflow/processors"
)

// Workflow is a chain of processors to run.
// It will run processors created in the order they are set.
type Workflow struct {
	Name string `json:"name"`
	// processors is the array containing all processors that has been added to the Workflow.
	processors []processors.Processor
	// ctx is a context passed by the current Application the workflow is added to
	ctx            context.Context
	failures       processors.FailurePipe
	failureHandler func(f processors.Failure)
	failureStop    context.CancelFunc
	sync.Mutex
}

// NewWorkflow will initiate a new workflow
func NewWorkflow(name string) *Workflow {
	return &Workflow{
		Name:           name,
		processors:     make([]processors.Processor, 0),
		failures:       make(processors.FailurePipe, 1000),
		failureHandler: processors.PrintFailure,
	}
}

// AddProcessor will append a new processor at the end of the flow
func (w *Workflow) AddProcessor(p processors.Processor) {
	w.Lock()
	defer w.Unlock()
	w.processors = append(w.processors, p)
}

// RemoveProcessor will remove an Processor from the Workflow
// Note that you will need to Restart the Workflow inorder for the Flow to work properly after removing an processor
func (w *Workflow) RemoveProcessor(i int) {
	w.Lock()
	defer w.Unlock()
	w.processors = append(w.processors[:i], w.processors[i+1:]...)
}

// SetFailureHandler is used to change the current Error Handler used by the workflow
// will requier a restart to take action
func (w *Workflow) SetFailureHandler(f func(f processors.Failure)) {
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
	for _, p := range w.processors {
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
	for i, p := range w.processors {
		// If Processor is already running, skip starting it
		if p.IsRunning() {
			continue
		}

		p.SetFailureChannel(w.failures)
		// Add the Previous Processors Egress as the Ingress
		// There is no Previous Processor for Index 0 , so only on bigger than 0
		if i != 0 {
			w.Lock()
			ingress := w.processors[i-1].GetEgress()
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
	for _, p := range w.processors {
		if p.IsRunning() {
			p.Stop()
		}
	}
	w.failureStop()
}
