// Package main is used to run an Application and API for Handeling workflows
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

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
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Properties  []*properties.Property `json:"properties"`
}

// API is handeling our mux and holds our slice of Workflows
type API struct {
	Workflows []*workflow.Workflow
	router    *mux.Router
}

func main() {

	fmt.Println("Starting the test app")
	api := &API{
		Workflows: make([]*workflow.Workflow, 0),
		router:    mux.NewRouter(),
	}
	generateTestData(api)
	// Setup CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:4200"},
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
	api.router.HandleFunc("/processors", api.GetProcessors).Methods("GET")
	api.router.HandleFunc("/processors", api.AddProcessor).Methods("POST")
	api.router.HandleFunc("/processors", api.ConfigureProcessor).Methods("PATCH")
	log.Fatal(http.ListenAndServe(":8080", corsHandler.Handler(api.router)))
	fmt.Println("Exiting")
}

func generateTestData(api *API) {

	work1 := workflow.NewWorkflow("read-daily-files")
	work2 := workflow.NewWorkflow("write-daily-files")
	unrelatedwork := workflow.NewWorkflow("spam-news")

	proc1, err := processmanager.GetProcessor("ReadFile")
	if err != nil {
		log.Fatal(err)
	}
	proc1.SetProperty("path", "this_example")
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

// ConfiugreProcessor is used to add values and Properties to a processor
func (a *API) ConfigureProcessor(w http.ResponseWriter, r *http.Request) {
	type configProcessor struct {
		Workflow  string               `json:"workflow"`
		Processor descriptionProcessor `json:"processor"`
	}

	var ap configProcessor

	err := json.NewDecoder(r.Body).Decode(&ap)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	fmt.Println(ap)
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

// GetWorkflows is used to get all the Workflows currently there
func (a *API) GetWorkflows(w http.ResponseWriter, r *http.Request) {

	data, err := json.Marshal(a.Workflows)
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
