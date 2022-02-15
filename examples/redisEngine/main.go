// package runner tool to run go4data files
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-redis/redis/v8"
	"github.com/percybolmer/go4data"
	"github.com/percybolmer/go4data/pubsub"

	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {

	var path string
	var port int

	flag.StringVar(&path, "go4data", "", "the path to the go4data YAML file to run")
	flag.IntVar(&port, "port", 0, "the port to host the prometheus metrics on")

	flag.Parse()

	if path == "" || port == 0 {
		flag.Usage()
		os.Exit(0)
	}

	_, err := pubsub.NewEngine(pubsub.WithRedisEngine(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	}))
	if err != nil {
		panic(err)
	}
	log.Println("Setting up go4data")
	wf, err := go4data.Load(path)
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
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}
