// This tool is used to generate a new Action and test file
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

type newAction struct {
	PackageName      string
	ActionName       string
	Location         string
	TemplateLocation string
}

func main() {
	var p newAction

	flag.StringVar(&p.PackageName, "package", "", "The name for the generated package")
	flag.StringVar(&p.TemplateLocation, "templatepath", "", "The path to the templates to use, can also set ACTIONGENERATORPATH env variable")
	flag.StringVar(&p.ActionName, "action", "", "The name of the action to generate")
	flag.StringVar(&p.Location, "location", "", "Location of the generated output file/Files")
	flag.Parse()

	if p.PackageName == "" || p.ActionName == "" || p.Location == "" {
		flag.Usage()
		os.Exit(0)
	}
	templatefiles := os.Getenv("ACTIONGENERATORPATH")
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
	f, err := os.Create(fmt.Sprintf("%s/%s.go", p.Location, p.ActionName))
	checkError(err)
	testf, err := os.Create(fmt.Sprintf("%s/%s_test.go", p.Location, p.ActionName))
	checkError(err)

	action, err := GetActionTemplate(p.TemplateLocation)
	checkError(err)
	tests, err := GetTestTemplate(p.TemplateLocation)
	checkError(err)

	err = action.Execute(f, p)
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

// GetActionTemplate will read the ation template
func GetActionTemplate(path string) (*template.Template, error) {
	return template.New("action.gohtml").ParseFiles(fmt.Sprintf("%s/%s", path, "action.gohtml"))
}

// GetTestTemplate will return a template of test file
func GetTestTemplate(path string) (*template.Template, error) {
	return template.New("action_test.gohtml").ParseFiles(fmt.Sprintf("%s/%s", path, "action_test.gohtml"))
}
