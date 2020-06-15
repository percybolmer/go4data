// Package fileprocessors is used to handle Processors related to file based processing
// such as reading files and writing files
package fileprocessors

import (
	"context"
	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/processors/processmanager"

	"github.com/percybolmer/workflow/properties"
	"github.com/percybolmer/workflow/relationships"
	"io/ioutil"
	"os"
)


// ReadFile is used to read files Locally from disk and output the contents
type ReadFile struct {
	Name     string `json:"name" yaml:"name"`
	running  bool
	cancel   context.CancelFunc
	ingress  relationships.PayloadChannel
	egress   relationships.PayloadChannel
	failures relationships.FailurePipe
	*properties.PropertyMap
	*metric.Metrics

	// custom settings for rfp
	ingressNeeded bool
	filepath string
	removeafter bool
}

func init() {
	err := processmanager.RegisterProcessor("ReadFile", NewReadFileInterface)
	if err != nil {
		panic(err)
	}
}
// NewReadFileInterface is used to register ReadFile
func NewReadFileInterface() interface{}{
	return NewReadFile()
}
// NewReadFile is used to initialize and generate a new processor
func NewReadFile() *ReadFile {
	rfp := &ReadFile{
		egress: make(relationships.PayloadChannel, 1000),
		PropertyMap: properties.NewPropertyMap(),
		Metrics: metric.NewMetrics(),
	}

	// Add Required Props -- remove_after
	rfp.AddRequirement("remove_after")
	return rfp
}

// Initialize will make sure all needed Properties and Metrics are generated
func (rfp *ReadFile) Initialize() error {
	// Reset values
	rfp.ingressNeeded = false
	rfp.filepath = ""
	rfp.removeafter = false

	// Make sure Properties are there
	ok, _ := rfp.ValidateProperties()
	if !ok {
		return properties.ErrRequiredPropertiesNotFulfilled
	}
	// ReadFile needs either an Ingress of File names OR a property called Filepath
	filepathProp := rfp.GetProperty("filepath")
	if filepathProp == nil {
		// Set ingress to needed
		rfp.ingressNeeded = true
	}else{
		rfp.filepath = filepathProp.String()
	}
	removeafter := rfp.GetProperty("remove_after")
	ra, err := removeafter.Bool()
	if err != nil {
		return err
	}
	rfp.removeafter = ra
	return nil
}
// IsRunning will return true or false based on if the processor is currently running
func (rfp *ReadFile) IsRunning() bool {
	return rfp.running
}
// GetMetrics will return a bunch of generated metrics, or nil if there isn't any
func (rfp *ReadFile) GetMetrics() []*metric.Metric {
	return rfp.GetAllMetrics()
}
// SetFailureChannel will configure the failure channel of the Processor
func (rfp *ReadFile) SetFailureChannel(fp relationships.FailurePipe) {
	rfp.failures = fp
}
// Start will spawn a goroutine that reads file and Exits either on Context.Done or When processing is finished
func (rfp *ReadFile) Start(ctx context.Context) error {
	if rfp.running {
		return failure.ErrAlreadyRunning
	}
	if rfp.ingressNeeded && rfp.ingress == nil {
		return failure.ErrIngressRelationshipNeeded
	}

	// We gotta make a check here, either spawn a goroutine that reads files continually, OR read from Filepath
	if !rfp.ingressNeeded {
		rfp.running = true
		err := rfp.readAndPublish(rfp.filepath)
		if err != nil {
			rfp.publishFailure(err, payload.BasePayload{
				Payload: nil,
				Source:  rfp.filepath,
			})
		}
		rfp.running = false
	} else {
		rfp.running = true
		c, cancel := context.WithCancel(ctx)
		rfp.cancel = cancel
		go func() {
			for {
				select {
					case payload := <-rfp.ingress:
						path := payload.GetPayload()
						err := rfp.readAndPublish(string(path))
						if err != nil {
							rfp.publishFailure(err, payload)
						}
						case <- c.Done():

							return
				}
			}
		}()
	}
	return nil
}
// readAndPublish will read a file and then publish the payload to the egress,
func (rfp *ReadFile) readAndPublish(path string) error {
	data, err := rfp.read(path)
	if err != nil {
		return err
	}
	rfp.egress <- payload.BasePayload{
		Payload: data,
		Source:  path,
	}
	rfp.AddMetric("files", "the number of files that has been read", 1)
	return nil
}
// read is used to ingest a file
func (rfp *ReadFile) read(path string) ([]byte, error){
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if rfp.removeafter {
			os.Remove(path)
		}
	}()
	return ioutil.ReadAll(file)
}
func (rfp *ReadFile) publishFailure(err error, payload payload.Payload) {
	if rfp.failures == nil {
		return
	}

	rfp.AddMetric("failures", "the number of failures sent by the processor", 1)
	rfp.failures <- failure.Failure{
		Err:       err,
		Payload:   payload,
		Processor: "ReadFile",
	}
}
// Stop will stop the processing
func (rfp *ReadFile) Stop() {
	if !rfp.running {
		return
	}
	rfp.running = false
	rfp.cancel()
}
// SetIngress will change the ingress of the processor, Restart is needed before applied changes
func (rfp *ReadFile) SetIngress(i relationships.PayloadChannel) {
	rfp.ingress = i
	return
}
// GetEgress will return an Egress that is used to output the processed items
func (rfp *ReadFile) GetEgress() relationships.PayloadChannel {
	return rfp.egress
}
