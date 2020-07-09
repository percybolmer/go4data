// Package main is used to run an Application and API for Handeling workflows
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/percybolmer/workflow"
	_ "github.com/percybolmer/workflow/processors/file-processors"
	_ "github.com/percybolmer/workflow/processors/filter-processors"
	"github.com/percybolmer/workflow/processors/processmanager"
	_ "github.com/percybolmer/workflow/processors/terminal-processors"
	"github.com/percybolmer/workflow/properties"
	"github.com/rs/cors"
)

var (
	// ErrDuplicateAlreadyExist is returned by the api when a user tries to add duplicate /workflows
	ErrDuplicateAlreadyExist = errors.New("an resource with that name already exists")
)

// descriptionProcessor is a way of sending processors to the UI thats easier to handle than just parsing processors straight
type descriptionProcessor struct {
	Name              string                 `json:"name"`
	Description       string                 `json:"description"`
	Properties        []*properties.Property `json:"properties"`
	SettingsValidated bool                   `json:"settingsValidated"`
	Running           bool                   `json:"running"`
}

type descriptionWorkflow struct {
	Name       string                 `json:"name"`
	Running    bool                   `json:"running"`
	Processors []descriptionProcessor `json:"processors"`
}

// API is handeling our mux and holds our slice of Workflows
type API struct {
	Workflows []*workflow.Workflow
	router    *mux.Router
}

type cfg struct {
	Port        int
	CertPath    string
	CertKeyPath string
	Origins     []string
}

func main() {

	// Extract needed Configs
	cfg := extractConfig()

	if cfg == nil {
		log.Fatal("Config cannot be nil")
	}

	log.Println("Starting the API on port: ", cfg.Port)
	api := &API{
		Workflows: make([]*workflow.Workflow, 0),
		router:    mux.NewRouter(),
	}
	generateTestData(api)
	// Setup CORS
	corsHandler := cors.New(cors.Options{

		AllowedOrigins: cfg.Origins,
		AllowedMethods: []string{
			http.MethodGet, //http methods for your app
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
			http.MethodHead,
		}, AllowedHeaders: []string{
			"*", //or you can your header key values which you are using in your application

		},
	})

	api.router.HandleFunc("/workflows", api.GetWorkflows).Methods("GET")
	api.router.HandleFunc("/workflows", api.AddWorkflows).Methods("POST")
	api.router.HandleFunc("/workflows", api.StartWorkflow).Methods("PATCH")
	api.router.HandleFunc("/processors", api.GetProcessors).Methods("GET")
	api.router.HandleFunc("/processors", api.AddProcessor).Methods("POST")
	api.router.HandleFunc("/processors/delete", api.DeleteProcessor).Methods("POST")
	api.router.HandleFunc("/processors/run", api.StartStopProcessor).Methods("POST")
	api.router.HandleFunc("/processors", api.ConfigureProcessor).Methods("PATCH")
	handler := corsHandler.Handler(api.router)
	err := http.ListenAndServeTLS(fmt.Sprintf(":%d", cfg.Port), cfg.CertPath, cfg.CertKeyPath, handler)
	//err := http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), handler)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func extractConfig() *cfg {
	certPath := os.Getenv("WORKFLOW_CERT")
	certKey := os.Getenv("WORKFLOW_KEY")
	certPort := os.Getenv("WORKFLOW_PORT")
	origins := os.Getenv("WORKFLOW_ORIGINS")
	if certPath == "" || certKey == "" || certPort == "" || origins == "" {
		log.Fatal("Please make sure that all the following environmental variables are set \n",
			"WORKFLOW_CERT should point to a certificate file to be used to host Https \n",
			"WORKFLOW_KEY should point to the server key to use \n",
			"WORKFLOW_PORT should be the port to host on \n",
			"WORKFLOW_ORIGINS should be full https addresses, comma seperated,  of origins to allow the API requests from \n")
		return nil
	}

	port, err := strconv.Atoi(certPort)
	if err != nil {
		log.Fatal(err)
		return nil
	}
	return &cfg{
		Port:        port,
		CertKeyPath: certKey,
		CertPath:    certPath,
		Origins:     strings.Split(origins, ","),
	}
}
func generateTestData(api *API) {

	work1 := workflow.NewWorkflow("read-daily-files")
	work2 := workflow.NewWorkflow("write-daily-files")
	unrelatedwork := workflow.NewWorkflow("spam-news")

	proc1, err := processmanager.GetProcessor("ReadFile")
	if err != nil {
		log.Fatal(err)
	}
	proc1.SetProperty("path", "/home/perbol/development/workflow/cmd/example/files/csv.txt")
	work1.AddProcessor(proc1)

	api.Workflows = append(api.Workflows, work1, work2, unrelatedwork)
}

// AddWorkflows is handler used to add a new workflow to an application
// workflows added wont be started
func (a *API) AddWorkflows(w http.ResponseWriter, r *http.Request) {
	var newWorkflow workflow.Workflow

	err := json.NewDecoder(r.Body).Decode(&newWorkflow)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	for _, owf := range a.Workflows {
		if owf.Name == newWorkflow.Name {
			http.Error(w, ErrDuplicateAlreadyExist.Error(), 500)
			return
		}
	}
	a.Workflows = append(a.Workflows,
		workflow.NewWorkflow(newWorkflow.Name))

	w.WriteHeader(200)
}

// StartWorkflow will listen on PATCH requests that contains a workflow, it will then run Start on that workflow
// And return errors if they occur
// If the workflow is running it will stop instead
func (a *API) StartWorkflow(w http.ResponseWriter, r *http.Request) {
	var newWorkflow workflow.Workflow

	err := json.NewDecoder(r.Body).Decode(&newWorkflow)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	for _, work := range a.Workflows {
		if work.Name == newWorkflow.Name {
			if work.IsRunning {
				work.Stop()
			} else {
				err := work.Start()
				if err != nil {
					http.Error(w, err.Error(), 500)
					return
				}
			}
		}
	}

	w.WriteHeader(200)
}

// ConfigureProcessor is used to add values and Properties to a processor
func (a *API) ConfigureProcessor(w http.ResponseWriter, r *http.Request) {
	type configProcessor struct {
		Workflow  string               `json:"workflow"`
		Processor descriptionProcessor `json:"processor"`
	}

	var ap configProcessor
	data, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer r.Body.Close()

	err = json.Unmarshal(data, &ap)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	for _, work := range a.Workflows {
		if work.Name == ap.Workflow {
			for _, processor := range work.Processors {
				if processor.GetName() == ap.Processor.Name {
					for _, prop := range ap.Processor.Properties {
						if prop.Value == nil {
							continue
						}
						// Make sure to Convert into the correct type here, seems like false is considerd a string etcetc,
						if prop.Value == "false" || prop.Value == "true" {
							b, _ := strconv.ParseBool(prop.Value.(string))
							prop.Value = b
						} else {
							// Take care of INts
							v, err := strconv.Atoi(prop.Value.(string))
							if err == nil {
								prop.Value = v
							}
						}
						err = processor.SetProperty(prop.Name, prop.Value)
						if err != nil {
							http.Error(w, err.Error(), 500)
							return
						}
					}
				}
			}
		}
	}
	w.WriteHeader(200)

}

// AddProcessor will take a post and add a processor to a workflow
//
func (a *API) AddProcessor(w http.ResponseWriter, r *http.Request) {
	type addprocessor struct {
		Workflow  string               `json:"workflow"`
		Processor descriptionProcessor `json:"processor"`
	}

	var ap addprocessor

	err := json.NewDecoder(r.Body).Decode(&ap)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer r.Body.Close()

	p, err := processmanager.GetProcessor(ap.Processor.Name)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	for _, w := range a.Workflows {
		if w.Name == ap.Workflow {
			w.AddProcessor(p)
		}
	}
	w.WriteHeader(200)
}

// DeleteProcessor will close a processor and then delete it from workflow
func (a *API) DeleteProcessor(w http.ResponseWriter, r *http.Request) {
	type addprocessor struct {
		Workflow  string               `json:"workflow"`
		Processor descriptionProcessor `json:"processor"`
	}

	var ap addprocessor

	err := json.NewDecoder(r.Body).Decode(&ap)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer r.Body.Close()

	// STOP PROCESSOR, THEN DELETE
	var found bool
	for _, w := range a.Workflows {
		for i, p := range w.Processors {
			if p.GetName() == ap.Processor.Name {
				p.Stop()
				w.RemoveProcessor(i)
				found = true
			}
		}
	}

	if found {
		w.WriteHeader(200)
		return
	}
	http.Error(w, "did not find the asked processor", 500)

}

// StartStopProcessor is used to start processors thats not running, or stop them if they ares
func (a *API) StartStopProcessor(w http.ResponseWriter, r *http.Request) {
	type addprocessor struct {
		Workflow  string               `json:"workflow"`
		Processor descriptionProcessor `json:"processor"`
	}

	var ap addprocessor

	err := json.NewDecoder(r.Body).Decode(&ap)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer r.Body.Close()
	for _, wf := range a.Workflows {
		if wf.Name == ap.Workflow {
			for _, p := range wf.Processors {
				if p.GetName() == ap.Processor.Name {
					// If is running, then stop, if started, then stop
					if p.IsRunning() {
						p.Stop()
					} else {
						err := p.Start(wf.Ctx)
						if err != nil {
							http.Error(w, err.Error(), 500)
							return
						}
					}
				}
			}
		}
	}
	w.WriteHeader(200)
}

// GetWorkflows is used to get all the Workflows currently there
func (a *API) GetWorkflows(w http.ResponseWriter, r *http.Request) {
	var output []descriptionWorkflow
	// Validate all Workflows so that we can show users if a processor is missing any needed values
	for _, wf := range a.Workflows {
		descWf := descriptionWorkflow{
			Name:    wf.Name,
			Running: wf.IsRunning,
		}
		for _, p := range wf.Processors {
			valid, _ := p.ValidateProperties()
			descWf.Processors = append(descWf.Processors, descriptionProcessor{
				Name:              p.GetName(),
				Description:       p.GetDescription(),
				SettingsValidated: valid,
				Properties:        p.GetProperties(),
				Running:           p.IsRunning(),
			})

		}
		output = append(output, descWf)
	}
	data, err := json.Marshal(output)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(200)
	w.Write(data)
}

// GetProcessors is used to extract all registerd processors and print them
func (a *API) GetProcessors(w http.ResponseWriter, r *http.Request) {
	result := processmanager.GetAllProcessors()

	output := make([]descriptionProcessor, len(result))
	for i, p := range result {
		output[i] = descriptionProcessor{
			Name:        p.GetName(),
			Description: p.GetDescription(),
			Properties:  p.GetProperties(),
		}
	}

	data, err := json.Marshal(output)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(200)
	w.Write(data)

}
