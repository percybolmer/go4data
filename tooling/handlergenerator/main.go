// This tool is used to generate a new Handler and test file
// It will generate a basic struct based on the super simple template
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"text/template"
)

type newHandler struct {
	PackageName      string
	HandlerName      string
	Location         string
	TemplateLocation string
}

func main() {
	var p newHandler

	flag.StringVar(&p.PackageName, "package", "", "The name for the generated package")
	flag.StringVar(&p.TemplateLocation, "templatepath", "", "The path to the templates to use, can also set HANDLERGENERATORPATH env variable")
	flag.StringVar(&p.HandlerName, "handler", "", "The name of the Handler to generate")
	flag.StringVar(&p.Location, "location", "", "Location of the generated output file/Files")
	flag.Parse()

	if p.PackageName == "" || p.HandlerName == "" || p.Location == "" {
		flag.Usage()
		os.Exit(0)
	}
	templatefiles := os.Getenv("HANDLERGENERATORPATH")
	if templatefiles == "" && p.TemplateLocation == "" {
		flag.Usage()
		os.Exit(0)
	}
	if templatefiles != "" {
		p.TemplateLocation = templatefiles
	}
	// Make sure File Location exists
	finfo := getFileStat(p.Location)
	if !finfo.IsDir() {
		log.Fatalf("Please specify a directory where to generate the files, Not a File")
		os.Exit(0)
	}
	// Generate files
	f, err := os.Create(fmt.Sprintf("%s/%s.go", p.Location, p.HandlerName))
	checkError(err)
	testf, err := os.Create(fmt.Sprintf("%s/%s_test.go", p.Location, p.HandlerName))
	checkError(err)

	Handler, err := GetHandlerTemplate(p.TemplateLocation)
	checkError(err)
	tests, err := GetTestTemplate(p.TemplateLocation)
	checkError(err)

	err = Handler.Execute(f, p)
	checkError(err)
	err = tests.Execute(testf, p)
	checkError(err)

	cmd := exec.Command("gofmt", "-w", p.Location+"/*")
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

// GetHandlerTemplate will read the ation template
func GetHandlerTemplate(path string) (*template.Template, error) {
	return template.New("handler.gohtml").ParseFiles(fmt.Sprintf("%s/%s", path, "handler.gohtml"))
}

// GetTestTemplate will return a template of test file
func GetTestTemplate(path string) (*template.Template, error) {
	return template.New("handler_test.gohtml").ParseFiles(fmt.Sprintf("%s/%s", path, "handler_test.gohtml"))
}
