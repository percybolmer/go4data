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
	"github.com/percybolmer/workflow/processors"
	_ "github.com/percybolmer/workflow/processors/file-processors"
	"github.com/percybolmer/workflow/processors/processmanager"
	"github.com/rs/cors"
)

var (
	// ErrApplicationDoesAlreadyExist is returned by the api when a user tries to add duplicate applications
	ErrApplicationDoesAlreadyExist = errors.New("an application with that name already exists")
)

type Api struct {
	Applications []*workflow.Application
	router       *mux.Router
}

type Api_Application struct {
	Name      string         `json:"name" yaml:"name"`
	Workflows []Api_Workflow `json:"children" yaml:"workflows"`
	Icon      string         `json:"icon"`
}

type Api_Workflow struct {
	Name string `json:"name"`
	// processors is the array containing all processors that has been added to the Workflow.
	Processors []Api_Processor `json:"children"`
	Icon       string          `json:"icon"`
}

type Api_Processor struct {
	Processor processors.Processor `json:"processor"`
	Icon      string               `json:"icon"`
	Name      string               `json:"name"`
}

func main() {

	fmt.Println("Starting the test app")
	api := &Api{
		Applications: make([]*workflow.Application, 0),
		router:       mux.NewRouter(),
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

	api.router.HandleFunc("/applications", api.GetApplications).Methods("GET")
	api.router.HandleFunc("/applications", api.AddApplication).Methods("POST")
	log.Fatal(http.ListenAndServe(":8080", corsHandler.Handler(api.router)))
	fmt.Println("Exiting")
}

func generateTestData(api *Api) {
	app := workflow.NewApplication("test")
	app2 := workflow.NewApplication("next")
	api.Applications = append(api.Applications, app)
	api.Applications = append(api.Applications, app2)

	work1 := workflow.NewWorkflow("read-daily-files")
	work2 := workflow.NewWorkflow("write-daily-files")
	unrelatedwork := workflow.NewWorkflow("spam-news")

	proc1, err := processmanager.GetProcessor("ReadFile")
	if err != nil {
		log.Fatal(err)
	}
	work1.AddProcessor(proc1)
	app.AddWorkflow(work1)
	app.AddWorkflow(work2)
	app2.AddWorkflow(unrelatedwork)
}

// AddApplication is a handler used to add new Applications
// It wont accept duplicates
func (a *Api) AddApplication(w http.ResponseWriter, r *http.Request) {
	var newApp Api_Application

	err := json.NewDecoder(r.Body).Decode(&newApp)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	for _, app := range a.Applications {
		// See if there is a conflict in the name
		if app.Name == newApp.Name {
			http.Error(w, ErrApplicationDoesAlreadyExist.Error(), 500)
			return
		}
	}
	new := workflow.NewApplication(newApp.Name)
	a.Applications = append(a.Applications, new)
	w.WriteHeader(200)
	w.Write([]byte(`ok`))

}

// GetApplications is used to get all the applications currently there
func (a *Api) GetApplications(w http.ResponseWriter, r *http.Request) {

	newApps := make([]Api_Application, 0)
	for _, app := range a.Applications {
		addThis := Api_Application{
			Name:      app.Name,
			Workflows: nil,
			Icon:      "dynamic_feed",
		}
		for _, wf := range app.Workflows {
			addThisWF := Api_Workflow{
				Name: wf.Name,
				Icon: "work",
			}

			for _, p := range wf.Processors {
				addThisWF.Processors = append(addThisWF.Processors, Api_Processor{
					Processor: p,
					Icon:      "memory",
					Name:      p.GetName(),
				})
			}

			addThis.Workflows = append(addThis.Workflows, addThisWF)
		}
		newApps = append(newApps, addThis)
	}
	data, err := json.Marshal(newApps)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	w.WriteHeader(200)
	w.Write(data)
}
