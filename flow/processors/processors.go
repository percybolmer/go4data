package processors

import (
	"encoding/json"
	"errors"

	"github.com/percybolmer/workflow/flow"
)

var (
	//ErrProcessorAlreadyExists is when somebody runs RegisterProcessor and gives a name that is already taken
	ErrProcessorAlreadyExists error = errors.New("A processor named that does already exists")
)

// ProcessorMap is a map containing all the given Proccessors and is inited via the init method, add custom functions to this map
// and they will be possible to configure in the workflow file
var ProcessorMap map[string]func(*flow.Flow)

// init is always run, even if somebody only imports our package, so this is a great place to put our processors function
func init() {
	ProcessorMap = make(map[string]func(*flow.Flow))
	// Add default proccessors here
	ProcessorMap["stdout"] = Stdout
	ProcessorMap["readfile"] = ReadFile
	ProcessorMap["writefile"] = WriteFile
	ProcessorMap["monitordirectory"] = MonitorDirectory
	ProcessorMap["parse_csv"] = ParseCsvFlow
	ProcessorMap["cmd"] = Cmd

}

// RegisterProcessor is used to add custom processors to the processorMap
// This has to be done for the Workflows to run them
func RegisterProcessor(name string, f func(*flow.Flow)) error {
	if _, ok := ProcessorMap[name]; ok {
		return ErrProcessorAlreadyExists
	}
	ProcessorMap[name] = f
	return nil
}

// ProcessorTemplate this is a base processor that I would recommend every processor to replicate
func ProcessorTemplate(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	// Replace customStrcut with Custom struct
	var customStruct string
	err := json.Unmarshal(confByte, &customStruct)
	if err != nil {
		inflow.Log(err)
		return
	}
	//inflow.Statistics.AddStat("ingress_bytes", len(newinput.GetPayload()))
	//inflowf.Statistics.AddStat("ingress_flows", 1)
	// Get waitgroup to correctly handle Gorotuines shutting down and waiting
	wg := inflow.GetWaitGroup()
	// Set egress for follow up flow
	egress := make(chan flow.Payload)
	inflow.SetEgressChannel(egress)
	// Do stuff with ur processor, either sent egress payloads once or start goroutine to handle flow that should maintain
	go func() {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case payload := <-inflow.GetIngressChannel():
				// Do stuff with payload?
				// Add payload Output to egress_bytes ?
				egress <- payload
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}
