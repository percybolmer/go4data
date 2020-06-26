// package filter processors is generated by generate-processor tooling
// Make sure to insert real Description here
package filterprocessors


import (
    "context"
    "encoding/json"
    "errors"
    "github.com/percybolmer/workflow/failure"
    "github.com/percybolmer/workflow/metric"
    "github.com/percybolmer/workflow/payload"
    "github.com/percybolmer/workflow/processors/processmanager"
    "github.com/percybolmer/workflow/properties"
    "github.com/percybolmer/workflow/relationships"
)

var (
    //ErrNotInitialized is when trying to start without a proper initialize
    ErrNotInitialized = errors.New("the processor is not properly initialized")
)
// MapFilter is used to $INSERT DESCRIPTION
type MapFilter struct{
    Name     string `json:"name,omitempty" yaml:"name,omitempty"`
    running  bool
    cancel   context.CancelFunc
    ingress  relationships.PayloadChannel
    egress   relationships.PayloadChannel
    failures relationships.FailurePipe
    *properties.PropertyMap `json:"properties,omitempty" yaml:"properties,omitempty"`
    *metric.Metrics `json:"metrics,omitempty" yaml:",inline,omitempty"`

    strict bool
    filters map[string]string
}
// init is used to Register the processor to the process manager
func init() {
    err := processmanager.RegisterProcessor("MapFilter", NewMapFilterInterface)
    if err != nil {
    panic(err)
    }
}
// NewMapFilterInterface is used to return the Processor as interface
// This is to avoid Cyclic imports, we are not allowed to return processors.Processor
// so, let process manager deal with the type assertion
func NewMapFilterInterface() interface{} {
    return NewMapFilter()
}

// NewMapFilter is used to initialize and generate a new processor
func NewMapFilter() *MapFilter {
    proc := &MapFilter{
        egress: make(relationships.PayloadChannel, 1000),
        PropertyMap: properties.NewPropertyMap(),
        Metrics: metric.NewMetrics(),
    }
    // Add AvailableProperties
    proc.AddAvailableProperty("strict", "Setting strict to true will make the processor only consider a match when ALL filter values applies to a map")
    proc.AddAvailableProperty("filters", "An Key->Value setting. Setting a filter here will check if the incoming map has the same key and if it matches the filter value")
    // Add Required Props -- remove_after
    proc.AddRequirement("filters")
    return proc
}

// Initialize will make sure all needed Properties and Metrics are generated
func (proc *MapFilter) Initialize() error {

    // Make sure Properties are there
    ok, _ := proc.ValidateProperties()
    if !ok {
        return properties.ErrRequiredPropertiesNotFulfilled
    }

    strictProp := proc.GetProperty("strict")
    if strictProp != nil {
        value, err := strictProp.Bool()
        if err != nil {
            return err
        }
        proc.strict = value
    }
    filterProp := proc.GetProperty("filters")
    if filterProp != nil {
        filters, err := filterProp.StringMap()
        if err != nil {
            return err
        }
        proc.filters = filters
    }

    return nil
}

// Start will spawn a goroutine that reads file and Exits either on Context.Done or When processing is finished
func (proc *MapFilter) Start(ctx context.Context) error {
    if proc.running {
        return failure.ErrAlreadyRunning
    }
    // Uncomment if u need to Processor to require an Ingress relationship
    if proc.ingress == nil {
        return failure.ErrIngressRelationshipNeeded
    }
    if proc.filters == nil {
       return ErrNotInitialized
    }

    proc.running = true
    // context will be used to spawn a Cancel func
    c, cancel := context.WithCancel(ctx)
    proc.cancel = cancel
    go func() {
        for {
            select {
                case payload := <-proc.ingress:
                    data, err := proc.IsPayloadMap(payload)
                    if err != nil {
                        proc.publishFailure(err, payload)
                    }
                    if proc.IsMatch(data){
                        proc.egress <- payload
                        proc.AddMetric("matches", "the amount of matches found", 1)
                    }else{
                        proc.AddMetric("non-matches", "the amount of non matched items", 1)
                    }

                case <- c.Done():
                    return
            }
        }
    }()
    return nil
}
// IsMatch is used to check if the map contains any of the filter values
// if processor is set to strict it will only return true if all values exist
func (proc *MapFilter) IsMatch(data map[string]string) bool {
    foundItems := 0
    totalItems := len(proc.filters)

    for key, filter := range proc.filters{
        // See if key exists in data
        if value, ok := data[key]; ok {
            if value == filter {
                foundItems++
            }
        }
    }

    if proc.strict{
        // Only pass true if the number of founditems is equal to totalItems
        if foundItems == totalItems{
            return true
        }
        return false
    }
    if foundItems > 0 {
        return true
    }
    return false
}
// IsPayloadMap makes sure the input payload is of the correct type
func (proc *MapFilter) IsPayloadMap(p payload.Payload) (map[string]string, error) {
    // Make sure Input is a Map[string]string ?
    row := make(map[string]string, 0)
    err := json.Unmarshal(p.GetPayload(), &row)
    if err != nil {
        return nil, err
    }
    return row, nil
}
// publishFailure is used to send out failures
func (proc *MapFilter) publishFailure(err error, payload payload.Payload) {
    if proc.failures == nil {
        proc.failures = make(relationships.FailurePipe,1000)
    }

    proc.AddMetric("failures", "the number of failures sent by the processor", 1)
    proc.failures <- failure.Failure{
        Err:       err,
        Payload:   payload,
        Processor: "MapFilter",
    }
}
// IsRunning will return true or false based on if the processor is currently running
func (proc *MapFilter) IsRunning() bool {
    return proc.running
}
// GetMetrics will return a bunch of generated metrics, or nil if there isn't any
func (proc *MapFilter) GetMetrics() []*metric.Metric {
    return proc.GetAllMetrics()
}
// SetFailureChannel will configure the failure channel of the Processor
func (proc *MapFilter) SetFailureChannel(fp relationships.FailurePipe) {
    proc.failures = fp
}

// Stop will stop the processing
func (proc *MapFilter) Stop() {
    if !proc.running {
        return
    }
    proc.running = false
    proc.cancel()
}
// SetIngress will change the ingress of the processor, Restart is needed before applied changes
func (proc *MapFilter) SetIngress(i relationships.PayloadChannel) {
    proc.ingress = i
    return
}
// GetEgress will return an Egress that is used to output the processed items
func (proc *MapFilter) GetEgress() relationships.PayloadChannel {
    return proc.egress
}