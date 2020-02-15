package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"sync"
	"time"

	"github.com/percybolmer/workflow/flow"
	"github.com/percybolmer/workflow/readers"
	"github.com/rs/zerolog"
)

// Processors is a map containing all the given Proccessors and is inited via the init method, add custom functions to this map
// and they will be possible to configure in the workflow file
var processors map[string]func(*flow.Flow)

// init is always run, even if somebody only imports our package, so this is a great place to put our processors function
func init() {
	processors = make(map[string]func(*flow.Flow))
	// Add default proccessors here
	processors["stdout"] = Stdout
	processors["readfile"] = readers.ReadFile
	processors["writefile"] = readers.WriteFile
	processors["monitordirectory"] = readers.MonitorDirectory
	processors["parse-csv"] = readers.ParseCsvFlow

}

// Workflows is a collection of gather workflows that are currently configured
type Workflows struct {
	Flows []Workflow `json:"workflows"`
}

//Workflow is a whole workflow chain, it contains Processors that are executed in the order of the Procesors Slice
type Workflow struct {
	// Name is the name of the flow
	Name       string       `json:"name"`
	Processors []*flow.Flow `json:"processors"`
	// TODO currently only File based logging is allowed, change this to any wanted type.....if requested
	Logger  zerolog.Logger `json:"-"`
	LogPath string         `json:"logpath"`
}

func main() {
	// Start by reading configured Workflows
	wflow := loadWorkflow()
	if len(wflow.Flows) == 0 {
		panic("Did not read the workflow file properly")
	}

	var wg sync.WaitGroup
	for _, flow := range wflow.Flows {
		flow.Start(&wg)
	}
	// Wait until all Flows are upp and Running
	wg.Wait()
	// Dirty trick to BLock forever, this shouldd be replaced by a hosted GUI or API
	for {
		time.Sleep(10 * time.Second)
	}

}

// SetupLogging is used to enable configured Logging
func (w *Workflow) SetupLogging() {
	if w.LogPath == "" {
		w.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	} else {
		date := time.Now().Format("02-01-2006")
		f, err := os.OpenFile(fmt.Sprintf("%s/%s-%s", w.LogPath, w.Name, date), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			// TODO how do I solve errors before the workflows are initialized?, right now jst stdout, but in the future?
			w.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
			w.Logger.Log().Msgf("Error setting up logger: %s", err)
		}
		w.Logger = zerolog.New(f).With().Timestamp().Logger()
	}
}

// StartLogging will enable logging for a flow
func (w *Workflow) StartLogging(wg *sync.WaitGroup, inflow *flow.Flow) {
	defer wg.Done()
	wg.Add(1)
	go func() {
		for {
			select {
			case err := <-inflow.ErrorChannel:
				if err != nil {
					w.Logger.Log().Msg(err.Error())
				}
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}

// Start will trigger an ingress in a goroutine and listen on that goroutine
func (w *Workflow) Start(wg *sync.WaitGroup) {
	w.SetupLogging()
	//fmt.Println("Workflow: ", w.Name, "  has X amount of Processors configured ", len(w.Processors))
	for index, flow := range w.Processors {
		flow.SetWaitGroup(wg)
		if p, ok := processors[flow.ProcessorName]; ok {
			if index > 0 {
				//  Channels are passed by reference by default. Thats why I have made these GetEgress/SetEgress to transfer
				// the channel properly between flows
				flow.SetIngressChannel(w.Processors[index-1].GetEgressChannel())
			}

			p(flow)
			w.StartLogging(wg, flow)

		} else {
			// No Processor found with that Task name, Log?
			w.Logger.Log().Str("No such processor found", flow.ProcessorName).Str("workflow", w.Name).Msg("Exiting current workflow")
			w.Close()
			return

		}
	}
}

// Close will itterate all processors and close them
func (w *Workflow) Close() {
	for _, flow := range w.Processors {
		flow.Close()
	}
}

// Stdout is a processor used to print Information about the payloads recieved on a Flow
// This is mainly used for debugging
func Stdout(f *flow.Flow) {
	// Print any Payload set, or any payload from any EgressChannel
	if f.GetIngressChannel() == nil {
		f.Log(flow.ErrNoIngressChannel)
		return
	}

	wg := f.GetWaitGroup()
	defer wg.Done()
	wg.Add(1)

	outputChannel := make(chan flow.Payload, flow.DefaultBufferSize)
	f.SetEgressChannel(outputChannel)

	go func() {
		for {
			select {
			case payload := <-f.GetIngressChannel():
				fmt.Println(fmt.Sprintf("%s: \n%s", payload.GetSource(), payload.GetPayload()))
				outputChannel <- payload
			case <-f.StopChannel:
				return
			}
		}
	}()

}

//ProcessorTemplate this is a base processor that I would recommend every processor to replicate
func ProcessorTemplate(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	// Replace customStrcut with Custom struct
	var customStruct string
	err := json.Unmarshal(confByte, &customStruct)
	if err != nil {
		inflow.Log(err)
		return
	}

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
				egress <- payload
			case <-inflow.StopChannel:
				return
			}
		}
	}()

}

// helper function to just view docker files
func listDirectory(path string) {
	files, err := ioutil.ReadDir(path)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("*********************Directory Listing of ", path, "*********************")
	for _, f := range files {
		fmt.Println(f.Name())
	}
}

//loadWorkFlow is used to get the workflow file and unmarshal it
// will panic since the workflow file is a needed element to actually run the program
func loadWorkflow() Workflows {
	path := os.Getenv("WORKFLOW_PATH")
	if path == "" {
		panic("No workflow file is found, cannot operate without a workflow")
	}
	workfile, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	var w Workflows
	err = json.Unmarshal(workfile, &w)
	if err != nil {
		panic(err)
	}
	for _, f := range w.Flows {
		for _, fl := range f.Processors {
			fl = flow.NewFlow(fl.ProcessorName, nil, fl.Configuration)
		}
	}
	return w
}
