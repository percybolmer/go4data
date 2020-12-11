// package runner tool to run workflow files
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/percybolmer/workflow"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	var path string
	var port int

	flag.StringVar(&path, "workflow", "", "the path to the workflow YAML file to run")
	flag.IntVar(&port, "port", 0, "the port to host the prometheus metrics on")

	flag.Parse()

	if path == "" || port == 0 {
		flag.Usage()
		os.Exit(0)
	}
	log.Println("Setting up workflow")
	wf, err := workflow.Load(path)
	if err != nil {
		log.Fatal(err)
	}
	ctx := context.Background()
	for _, proc := range wf {
		if err := proc.Start(ctx); err != nil {
			log.Fatal(err)
		}
	}
	log.Println("Starting the Metrics API at /metrics")

	// @TODO better Error Handeling when running the runner.
	http.Handle("/metrics", promhttp.Handler())
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
}
