// Package main is used to run an Application and API for Handeling workflows
package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/percybolmer/workflow"
	"github.com/percybolmer/workflow/processors"
	"github.com/percybolmer/workflow/processors/processmanager"
	"log"
	"net/http"
	_ "github.com/percybolmer/workflow/processors/file-processors"
)


type Api struct {
	Applications []*workflow.Application
	router *mux.Router
}


type Api_Application struct {
	Name      string               `json:"name" yaml:"name"`
	Workflows []Api_Workflow`json:"children" yaml:"workflows"`
	Icon string `json:"icon"`
}

type Api_Workflow struct {
	Name string  `json:"name"`
	// processors is the array containing all processors that has been added to the Workflow.
	Processors []processors.Processor `json:"children"`
	Icon string `json:"icon"`
}

func main() {

	fmt.Println("Starting the test app")
	api := Api{
		Applications: make([]*workflow.Application,0),
		router: mux.NewRouter(),
	}

	app := workflow.NewApplication("test")
	app2 := workflow.NewApplication("next")
	api.Applications = append(api.Applications, app)
	api.Applications = append(api.Applications, app2)

	work1 := workflow.NewWorkflow("read-daily-files")
	work2 := workflow.NewWorkflow("write-daily-files")
	unrelatedwork := workflow.NewWorkflow("spam-news")


	proc1 ,err:= processmanager.GetProcessor("ReadFile")
	if err != nil {
		log.Fatal(err)
	}
	work1.AddProcessor(proc1)
	app.AddWorkflow(work1)
	app.AddWorkflow(work2)
	app2.AddWorkflow(unrelatedwork)
	api.router.HandleFunc("/getapplications", api.GetApplications)
	log.Fatal(http.ListenAndServe(":8080", api.router))
	fmt.Println("Exiting")
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}
func (a Api) GetApplications(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	newApps := make([]Api_Application,0)
	for _, app := range a.Applications{
		addThis := Api_Application{
			Name:      app.Name,
			Workflows: nil,
			Icon: "dynamic_feed",
		}
		for _, wf := range app.Workflows{
			addThis.Workflows = append(addThis.Workflows, Api_Workflow{
				Name:       wf.Name,
				Processors: wf.Processors,
				Icon:       "work",
			})
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

