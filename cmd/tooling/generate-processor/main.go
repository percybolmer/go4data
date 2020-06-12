// This tool is used to generate a new Proccessor and test file
// It will generate a basic struct based on the super simple template
package main

import (
	"flag"
	"fmt"
	"os"
	"log"
	"text/template"
	"os/exec"
)

type newProcessor struct {
	PackageName string
	ProcessorName string
	Location string
}

func main(){
	var p newProcessor
	flag.StringVar(&p.PackageName, "package", "", "The name for the generated package")
	flag.StringVar(&p.ProcessorName, "processor", "", "The name of the processor to generate")
	flag.StringVar(&p.Location, "location", "", "Location of the generated output file/Files")
	flag.Parse()
	if p.PackageName == "" || p.ProcessorName == "" || p.Location == "" {
		flag.Usage()
		os.Exit(0)
	}
	// Make sure File Location exists
	finfo := getFileStat(p.Location)
	if !finfo.IsDir() {
		log.Fatalf("Please specify a directory where to generate the files, Not a File")
		os.Exit(0)
	}

	// Generate files
	f, err := os.Create(fmt.Sprintf("%s/%s.go", p.Location, p.ProcessorName))
	checkError(err)
	testf, err := os.Create(fmt.Sprintf("%s/%s_test.go", p.Location, p.ProcessorName))
	checkError(err)

	processor, err := template.ParseFiles("processor.gohtml")
	checkError(err)
	tests, err := template.ParseFiles("processor_test.gohtml")
	checkError(err)

	err = processor.Execute(f, p)
	checkError(err)
	err = tests.Execute(testf, p)
	checkError(err)

	cmd := exec.Command("gofmt", "-w", p.Location + "/*")
	cmd.Run()



}

// getFileStat will get filestats or create a Directory,
// will trigger error if something goes wrong
func getFileStat(location string) os.FileInfo {
	finfo, err := os.Stat(location)
	if os.IsNotExist(err) {
		err := os.Mkdir(location, 0755)
		checkError(err)
		finfo, err = os.Stat(location)
		checkError(err)
		return finfo
	}
	return finfo
}
func checkError(err error) {
	if err != nil {
		panic(err)
	}
}
