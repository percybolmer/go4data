package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"reflect"
	"sync"

	"github.com/percybolmer/workflow/readers"
)

// Processors is a map containing all the given Proccessors and is inited via the init method, add custom functions to this map
// and they will be possible to configure in the workflow file
var processors map[string]func(readers.Flow) readers.Flow

// init is always run, even if somebody only imports our package, so this is a great place to put our processors function
func init() {
	processors = make(map[string]func(readers.Flow) readers.Flow)
	// Add default proccessors here
	processors["readfile"] = readers.ReadFile
	processors["monitordirectory"] = readers.MonitorDirectory
	processors["stdout"] = Stdout
	processors["parse-csv"] = readers.ParseCsvFlow

}

type workflows struct {
	Flows []workflow `json:"workflows"`
}
type workflow struct {
	// Name is the name of the flow
	Name       string      `json:"name"`
	Processors []processor `json:"processors"`
}

type processor struct {
	Task          string          `json:"task"`
	Configuration json.RawMessage `json:"configuration"`
	Flow          readers.Flow    `json:"-"`
}

func main() {
	// Start by reading configured Workflows
	wflow := loadWorkflow()
	if len(wflow.Flows) == 0 {
		panic("Did not read the workflow file properly")
	}

	var wg sync.WaitGroup
	for _, flow := range wflow.Flows {
		wg.Add(1)
		// @TODO adding go before flow.Start will actually make everything run twice.... I dont yet know why.... for now, Ill settle for without separate goroutine	§
		flow.Start(&wg)
	}
	// Fix for waiting forever atm ..
	wg.Add(1)
	wg.Wait()

}

// Start will trigger an ingress in a goroutine and listen on that goroutine
func (w *workflow) Start(wg *sync.WaitGroup) {
	defer wg.Done()
	// New Waitgroup that waits for each Proccessor
	//var processwaitGroup sync.WaitGroup
	var nextFlow readers.Flow = &readers.NewFlow{}
	//fmt.Println("Workflow: ", w.Name, "  has X amount of Processors configured ", len(w.Processors))
	for _, processor := range w.Processors {
		if p, ok := processors[processor.Task]; ok {
			newFlow := &readers.NewFlow{}
			// Apply the current Processors configuration to the flow
			newFlow.SetConfiguration(processor.Configuration)
			// Set the previous Flow's egressChannel to the NewFlow if its not Nil
			if !reflect.ValueOf(nextFlow).IsNil() && nextFlow.GetEgressChannel() != nil {
				// Set the previsous Flows Egress into the NewFlows ingress
				newFlow.SetIngressChannel(nextFlow.GetEgressChannel())
			}
			processor.Flow = newFlow
			// Replace value of nextFlow with the returned Flow
			nextFlow = p(newFlow)

			// Error Checking, @TODO make this a Goroutine when Logging configuration is done, so Processors can make Error() reutrn errors from a channel.
			err := newFlow.Error()
			if err != nil {
				fmt.Println(err)
			}
		} else {
			// No Processor found with that Task name, Log?
			fmt.Println("NO SUCH PROCESSOR IS FOUND")
		}
	}

}

// Stdout is a processor used to print Information about the payloads recieved on a Flow
// This is mainly used for debugging
func Stdout(f readers.Flow) readers.Flow {
	// Print any Payload set, or any payload from any EgressChannel
	if len(f.GetPayload()) != 0 {
		fmt.Println(fmt.Sprintf("%s: \n%s", f.GetSource(), f.GetPayload()))
		return nil
	}
	if f.GetIngressChannel() == nil {
		return nil
	}
	go func() {
		for {
			select {
			case flow := <-f.GetIngressChannel():
				fmt.Println(fmt.Sprintf("%s: \n%s", flow.GetSource(), flow.GetPayload()))
			}
		}
	}()

	return nil
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
	return w
}
