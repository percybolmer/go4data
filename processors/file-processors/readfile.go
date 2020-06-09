package file-processors



// ReadFileProcessor is used to read files Locally from disk and output the contents
type ReadFileProcessor struct {
	Name     string
	running  bool
	cancel   context.CancelFunc
	ingress  Relationship
	egress   Relationship
	failures FailurePipe
	*properties.PropertyMap
	*metric.Metrics
}
// Initialize will make sure all needed Properties and Metrics are generated
func (tp *ReadFileProcessor) Initialize() error {
	tp.egress = make(Relationship, 1000)
	tp.PropertyMap = properties.NewPropertyMap()
	tp.Metrics = metric.NewMetrics()

	// Make sure Properties are there
	// ReadFile needs either an Ingress of File names OR a property called Filepath


	return nil
}
// IsRunning will return true or false based on if the processor is currently running
func (tp *ReadFileProcessor) IsRunning() bool {
	return tp.running
}
// GetMetrics will return a bunch of generated metrics, or nil if there isnt any
func (tp *ReadFileProcessor) GetMetrics() []*Metric {
	return tp.Metrics.metric
}
// SetFailureChannel will configure the failure channel of the Processor
func (tp *ReadFileProcessor) SetFailureChannel(fp FailurePipe) {
	tp.failures = fp
}
// Start will spawn a goroutine that reads file and Exits either on Context.Done or When processing is finished
func (tp *ReadFileProcessor) Start(ctx context.Context) error {
	if tp.running {
		return ErrAlreadyRunning
	}/*
	if tp.ingress == nil {
		return ErringressRelationshipNeeded
	}
	go func() {
		tp.running = true
		c, cancel := context.WithCancel(ctx)
		tp.cancel = cancel
		for {
			select {
			case payload := <-tp.ingress:
				fmt.Printf("%s", payload.GetPayload())
			case <-c.Done():
				return
			}
		}
	}()*/
	return nil
}
// Stop will stop the processing
func (tp *ReadFileProcessor) Stop() {
	if !tp.running {
		return
	}
	tp.running = false
	tp.cancel()
}
// SetIngress will change the ingress of the processsor, Restart is needed before applied changes
func (tp *ReadFileProcessor) SetIngress(i Relationship) {
	return
}
// GetEgress will return an Egress that is used to output the processed items
func (tp *ReadFileProcessor) GetEgress() Relationship {
	return nil
}
