// package main is used to showcase an example use of workflow
package main

import (
	"github.com/percybolmer/workflow"
	fileprocessors "github.com/percybolmer/workflow/processors/file-processors"
	"github.com/percybolmer/workflow/processors/processmanager"
	"os"
	"time"
)

func main() {

	go WithProcessMananger()

	go WithoutProcessManager()

}

func WithProcessMananger() {
	app := workflow.NewApplication("example_app")

	w := workflow.NewWorkflow("file_mover")

	f, err := os.Create("processManager.txt")
	if err != nil {
		panic(err)
	}
	f.Write([]byte(`Hello Process Manager\n`))
	readproc, err := processmanager.GetProcessor("ReadFile")
	if err != nil {
		panic(err)
	}
	writeproc, err := processmanager.GetProcessor("WriteFile")
	if err != nil {
		panic(err)
	}
	readproc.SetProperty("remove_after", true)
	readproc.SetProperty("filepath", "processManager.txt")

	writeproc.SetProperty("path", "here")
	writeproc.SetProperty("append", true)

	w.AddProcessor(readproc)
	w.AddProcessor(writeproc)

	app.AddWorkflow(w)
	err = app.Start()
	if err != nil {
		panic(err)
	}
	time.Sleep(2 * time.Second)
}

func WithoutProcessManager() {
	app := workflow.NewApplication("example_app")

	w := workflow.NewWorkflow("file_mover")

	f, err := os.Create("thisexample.txt")
	if err != nil {
		panic(err)
	}
	f.Write([]byte(`Hello world`))
	reader := fileprocessors.NewReadFile()
	reader.SetProperty("remove_after", true)
	reader.SetProperty("filepath", "thisexample.txt")

	writer := fileprocessors.NewWriteFile()
	writer.SetProperty("path", "here")
	writer.SetProperty("append", true)

	w.AddProcessor(reader)
	w.AddProcessor(writer)

	app.AddWorkflow(w)

	app.Start()

	time.Sleep(2 * time.Second)

}