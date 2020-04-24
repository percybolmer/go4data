package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/percybolmer/workflow"
)

type api struct {
	App *workflow.Application
}

// NewAPI is used to create a new API instance that hosts a webpage api for an workflow app
// Note that this will BLOCk since it hosts a api, use go before to avoid if u dont want to block
func NewAPI(app *workflow.Application) error {
	if app == nil {
		return errors.New("Application supported cannot be nil")
	}
	a := api{
		App: app,
	}
	a.start(app.APIPort)
	return nil
}

// start will be uesd to setup and start an API that the UI can use to communicate and get data
// the input is a port to host the api on
func (a *api) start(port int) {
	router := mux.NewRouter()

	router.HandleFunc("/getworkflows", a.GetWorkflowHandler).Methods("GET")

	fmt.Println("Hosting on port ", port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), router))
}

// GetWorkflowHandler is used to print out all the currently configured Workflows as JSOn
func (a *api) GetWorkflowHandler(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)

	/*type exportWorkflow struct {
		Name       string      `json:"name"`
		Processors []flow.Flow `json:"children"`
	}
	type response struct {
		Flows []exportWorkflow
	}
	res := response{
		Flows: make([]exportWorkflow, 0),
	}
	for _, flow := range a.App.Flows {
		exportFl := exportWorkflow{
			Name:       flow.Name,
			Processors: flowProcessors,
		}
		res.Flows = append(res.Flows, exportFl)
	}*/
	//data, err := json.Marshal(res.Flows)
	data, err := json.Marshal(a.App.Flows)
	if err != nil {
		log.Fatal(err)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write(data)
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}
