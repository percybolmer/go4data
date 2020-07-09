// Package fileprocessors is used to handle Processors related to file based processing
// such as reading files and writing files
package fileprocessors

import (
	"context"

	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/processors/processmanager"

	"io/ioutil"
	"os"

	"github.com/percybolmer/workflow/properties"
	"github.com/percybolmer/workflow/relationships"
)

// ReadFile is used to read files Locally from disk and output the contents
type ReadFile struct {
	Name                    string `json:"name" yaml:"name"`
	running                 bool
	cancel                  context.CancelFunc
	ingress                 relationships.PayloadChannel
	egress                  relationships.PayloadChannel
	failures                relationships.FailurePipe
	*properties.PropertyMap `json:",omitempty" yaml:"properties,omitempty"`
	*metric.Metrics         `json:",omitempty" yaml:",inline,omitempty"`

	// custom settings for proc
	ingressNeeded bool
	filepath      string
	removeafter   bool
}

func init() {
	err := processmanager.RegisterProcessor("ReadFile", NewReadFileInterface)
	if err != nil {
		panic(err)
	}
}

// NewReadFileInterface is used to register ReadFile
func NewReadFileInterface() interface{} {
	return NewReadFile()
}

// NewReadFile is used to initialize and generate a new processor
func NewReadFile() *ReadFile {
	proc := &ReadFile{
		egress:      make(relationships.PayloadChannel, 1000),
		PropertyMap: properties.NewPropertyMap(),
		Metrics:     metric.NewMetrics(),
		Name:        "ReadFile",
	}

	proc.AddProperty("remove_after", "This property is used to configure if files that are read should be removed after", false)
	proc.AddProperty("path", "The path of the file that is suppose to be read, if left empty the processor will take the payloads from previous processor", true)

	return proc
}

// GetName returns the unique name of the processor
func (proc *ReadFile) GetName() string {
	return proc.Name
}

// GetDescription returns the the description
func (proc *ReadFile) GetDescription() string {
	return "Reads the content of a file and outputs the contents"
}

// SetName is used to change the processor name
func (proc *ReadFile) SetName(name string) {
	proc.Name = name
}

// Initialize will make sure all needed Properties and Metrics are generated
func (proc *ReadFile) Initialize() error {
	// Reset values
	proc.ingressNeeded = false
	proc.filepath = ""
	proc.removeafter = false

	// Make sure Properties are there
	ok, _ := proc.ValidateProperties()
	if !ok {
		return properties.ErrRequiredPropertiesNotFulfilled
	}
	// ReadFile needs either an Ingress of File names OR a property called Filepath
	filepathProp := proc.GetProperty("path")
	if filepathProp.Value == nil {
		// Set ingress to needed
		proc.ingressNeeded = true
	} else {
		proc.filepath = filepathProp.String()
	}
	removeafter := proc.GetProperty("remove_after")
	if removeafter.Value == nil {
		proc.removeafter = false
	} else {
		ra, err := removeafter.Bool()
		if err != nil {
			return err
		}
		proc.removeafter = ra

	}
	return nil
}

// IsRunning will return true or false based on if the processor is currently running
func (proc *ReadFile) IsRunning() bool {
	return proc.running
}

// GetMetrics will return a bunch of generated metrics, or nil if there isn't any
func (proc *ReadFile) GetMetrics() []*metric.Metric {
	return proc.GetAllMetrics()
}

// SetFailureChannel will configure the failure channel of the Processor
func (proc *ReadFile) SetFailureChannel(fp relationships.FailurePipe) {
	proc.failures = fp
}

// Start will spawn a goroutine that reads file and Exits either on Context.Done or When processing is finished
func (proc *ReadFile) Start(ctx context.Context) error {
	if proc.running {
		return failure.ErrAlreadyRunning
	}
	if proc.ingressNeeded && proc.ingress == nil {
		return failure.ErrIngressRelationshipNeeded
	}

	// We gotta make a check here, either spawn a goroutine that reads files continually, OR read from Filepath
	if !proc.ingressNeeded {
		proc.running = true
		err := proc.readAndPublish(proc.filepath)
		if err != nil {
			proc.publishFailure(err, payload.BasePayload{
				Payload: nil,
				Source:  proc.filepath,
			})
		}
	} else {
		proc.running = true
		c, cancel := context.WithCancel(ctx)
		proc.cancel = cancel
		go func() {
			for {
				select {
				case payload := <-proc.ingress:
					path := payload.GetPayload()
					err := proc.readAndPublish(string(path))
					if err != nil {
						proc.publishFailure(err, payload)
					}
				case <-c.Done():

					return
				}
			}
		}()
	}
	return nil
}

// readAndPublish will read a file and then publish the payload to the egress,
func (proc *ReadFile) readAndPublish(path string) error {
	data, err := proc.read(path)
	if err != nil {
		return err
	}
	proc.egress <- payload.BasePayload{
		Payload: data,
		Source:  path,
	}
	proc.AddMetric("files", "the number of files that has been read", 1)
	return nil
}

// read is used to ingest a file
func (proc *ReadFile) read(path string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if proc.removeafter {
			os.Remove(path)
		}
	}()
	return ioutil.ReadAll(file)
}
func (proc *ReadFile) publishFailure(err error, payload payload.Payload) {
	if proc.failures == nil {
		proc.failures = make(relationships.FailurePipe, 1000)
	}

	proc.AddMetric("failures", "the number of failures sent by the processor", 1)
	proc.failures <- failure.Failure{
		Err:       err,
		Payload:   payload,
		Processor: "ReadFile",
	}
}

// Stop will stop the processing
func (proc *ReadFile) Stop() {
	if !proc.running {
		return
	}
	proc.running = false
	if proc.cancel != nil {
		proc.cancel()
	}
}

// SetIngress will change the ingress of the processor, Restart is needed before applied changes
func (proc *ReadFile) SetIngress(i relationships.PayloadChannel) {
	proc.ingress = i
	return
}

// GetEgress will return an Egress that is used to output the processed items
func (proc *ReadFile) GetEgress() relationships.PayloadChannel {
	return proc.egress
}
