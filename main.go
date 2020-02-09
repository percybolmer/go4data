package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"os"
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

}

type workflows struct {
	Flows []workflow `json:"workflows"`
}
type workflow struct {
	// Name is the name of the flow
	Name      string    `json:"name"`
	Task      string    `json:"task"`
	Ingresses []ingress `json:"ingress"`
	Egresses  []egress  `json:"egress"`
}

// ingress is a ingeseter struct used for configuration of the workflow ingress
type ingress struct {
	File      *fileingress      `json:"file"`
	Directory *directoryingress `json:"directory"`
	Redis     *redisIngress     `json:"redis"`
}

//redisIngress will read from a records redis topic
type redisIngress struct {
	Host     string `json:"host"`
	Password string `json:"password"`
	DB       int    `json:"db"`
	Topic    string `json:"topic"`
}

//directoryingress is used when its a directory that is suppose to be monitored over time, reading every new file
type directoryingress struct {
	fileingress
}

//fileingress is used when its a single file that is suppose to be read, and only once.
type fileingress struct {
	Path           string `json:"path"`
	Delimiter      string `json:"delimiter"`
	HeaderLength   int    `json:"headerlength"`
	SkipRows       int    `json:"skiprows"`
	RemoveIngested bool   `json:"removefiles"`
}

type egress struct {
	File *fileegress `json:"file"`
}

type fileegress struct {
	Path string `json:"path"`
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
		go flow.Start(&wg)
	}

	wg.Wait()
}

// Start will trigger an ingress in a goroutine and listen on that goroutine
func (w *workflow) Start(wg *sync.WaitGroup) {
	defer wg.Done()
	resultChan := make(chan readers.Flow)
	errChan := make(chan error)
	go w.Ingest(resultChan, errChan)

	for {
		select {
		case record := <-resultChan:
			w.Egress(record)
		case err := <-errChan:
			fmt.Println(err)
		}
	}
}

// Ingest will take the ingress sources and read data from them,
// It will accept a channel of readers.Flow and error that can be used by later stages to report on
func (w *workflow) Ingest(resultChan chan<- readers.Flow, errChan chan<- error) {
	for _, ingress := range w.Ingresses {
		// Handle the sources
		if ingress.File != nil {
			go ingestCsvFile(ingress.File, resultChan, errChan)
		}
		if ingress.Directory != nil {
			go ingestDirectory(ingress.Directory, resultChan, errChan)
		}
		if ingress.Redis != nil {
			go ingestRedis(ingress.Redis, resultChan, errChan)
		}
	}
}

// ingestRedis is used to read from a certain Redis Topic and read all records
func ingestRedis(d *redisIngress, resultChan chan<- readers.Flow, errChan chan<- error) {
	redisReader, err := readers.NewRedisReader(d.Host, d.Password, d.DB)
	if err != nil {
		errChan <- err
		return
	}
	redisReader.SubscribeTopic(d.Topic, resultChan, errChan)

}

// ingestDirectory will monitor a directory for any new files and reports findings to a resultchannel
func ingestDirectory(d *directoryingress, resultChan chan<- readers.Flow, errChan chan<- error) {
	finfo, err := os.Stat(d.Path)
	if err != nil {
		errChan <- err
		return
	}
	if !finfo.IsDir() {
		errChan <- errors.New("Cannot use directory ingestion on a regular file")
		return
	}

	csvReader := readers.NewCsvReader()
	csvReader.SetDelimiter(d.Delimiter)
	csvReader.SetHeaderLength(d.HeaderLength)
	csvReader.SetSkipRows(d.SkipRows)
	csvReader.SetRemoveIngested(d.RemoveIngested)
	csvReader.MonitorDirectory(d.Path, resultChan, errChan)

}

//ingestCsvFile will take a file and ingest all the csv-records from it
func ingestCsvFile(f *fileingress, resultChan chan<- readers.Flow, errChan chan<- error) {
	csvReader := readers.NewCsvReader()
	csvReader.SetDelimiter(f.Delimiter)
	csvReader.SetHeaderLength(f.HeaderLength)
	csvReader.SetSkipRows(f.SkipRows)
	csvReader.SetRemoveIngested(f.RemoveIngested)
	result, err := csvReader.Read(f.Path)
	if err != nil {
		errChan <- err
		return
	}
	resultChan <- result
}

//Egress will make sure all configured egresses will get the correct output
// The output will be Json of of the Flow
// note that If the payload is JSON already, it will be base64 encoded to prevent faulty changes
// this is a default when usin json.Marshal.
func (w *workflow) Egress(r readers.Flow) {
	for _, egress := range w.Egresses {
		if egress.File != nil {
			data, err := json.Marshal(r)
			if err != nil {
				panic(err)
			}
			err = ioutil.WriteFile(egress.File.Path+"/"+r.GetSource(), data, 0755)
			if err != nil {
				panic(err)
			}
		}
	}
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
