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
	/*
		processors["parse-csv"] = readers.ParseCsvFlow */

}

type workflows struct {
	Flows []workflow `json:"workflows"`
}
type workflow struct {
	// Name is the name of the flow
	Name       string       `json:"name"`
	Processors []*flow.Flow `json:"processors"`
}

func main() {
	// Start by reading configured Workflows
	wflow := loadWorkflow()
	if len(wflow.Flows) == 0 {
		panic("Did not read the workflow file properly")
	}

	var wg sync.WaitGroup
	for _, flow := range wflow.Flows {
		// @TODO adding go before flow.Start will actually make everything run twice.... I dont yet know why.... for now, Ill settle for without separate goroutine	§
		flow.Start(&wg)
	}
	// Wait until all Flows are upp and Running
	wg.Wait()
	// Dirty trick to BLock forever, this shouldd be replaced by a hosted GUI or API
	for {
		time.Sleep(10 * time.Second)
	}

}

// Start will trigger an ingress in a goroutine and listen on that goroutine
func (w *workflow) Start(wg *sync.WaitGroup) {

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
			// Handle loggin properly in the future
			go func() {
				for {
					select {
					case err := <-flow.ErrorChannel:
						if err != nil {
							fmt.Println(err)
						}
					case <-flow.StopChannel:
						return
					}
				}
			}()

		} else {
			// No Processor found with that Task name, Log?
			fmt.Println("NO SUCH PROCESSOR IS FOUND", flow.ProcessorName)
		}
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
func loadWorkflow() workflows {
	path := os.Getenv("WORKFLOW_PATH")
	if path == "" {
		panic("No workflow file is found, cannot operate without a workflow")
	}
	workfile, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	var w workflows
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
