package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/percybolmer/workflow"
)

func main() {
	// Start by reading configured Workflows
	app, err := workflow.NewApplicationFromFile(os.Getenv("WORKFLOW_PATH"))
	if err != nil {
		panic(err)
	}
	// Run app.Run With go or without, internal workflow will run Goroutines so its really not neccesarry to do go App.Run()
	go app.Run()
	// Dirty trick to BLock forever, this shouldd be replaced by a hosted GUI or API
	for {
		time.Sleep(10 * time.Second)
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
