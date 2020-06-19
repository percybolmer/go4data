package fileprocessors

import (
	"context"
	"errors"
	"github.com/percybolmer/workflow/failure"
	"github.com/percybolmer/workflow/relationships"
	"os"
	"testing"
)


func TestReadFileProcessor_read(t *testing.T) {
	rfp := NewReadFile()


	_, err := rfp.read("testfiles/no_permission.txt")
	if !os.IsPermission(err){
		t.Fatal("Reading invalid file should give an No permission error")
	}

	_, err = rfp.read("testfiles/read.txt")
	if err != nil {
		t.Fatal("Should not have had any errors reading a regular file:", err)
	}

}

func TestReadFileProcessor_Start(t *testing.T){
	rfp := NewReadFile()

	rfp.SetProperty("remove_after", true)
	err := rfp.Initialize()
	if err != nil {
		t.Fatal("Failed to setup: ", err)
	}
	rfp.ingress = make(relationships.PayloadChannel)
	err = rfp.Start(context.TODO())

	err = rfp.Start(context.TODO())
	if !errors.Is(err, failure.ErrAlreadyRunning){
		t.Fatalf("Should recieve already running error: %v",err)
	}

	rfp.Stop()
	if rfp.IsRunning(){
		t.Fatal("should have been able to stop correctly")
	}
}
func TestReadFileProcessor_Initialize(t *testing.T) {
	rfp := NewReadFile()
	// Empty Init should fail
	err := rfp.Initialize()
	if err == nil {
		t.Fatal("Should have failed to initialize without proper Properties set")
	}
	// remove_after should set ra to True
	rfp.SetProperty("remove_after", true)
	err = rfp.Initialize()
	if err != nil {
		t.Fatalf("Should have passed initialize now that all properties are there: %s", err.Error())
	}
	if !rfp.removeafter {
		t.Fatal("Remove after is not set to true tho property was set")
	}
	if !rfp.ingressNeeded {
		t.Fatal("No filepath was set, so an ingress req should be true")
	}
	// Setting filepath should set ingress needed to true
	rfp.SetProperty("path", "/path/to/file")
	err = rfp.Initialize()
	if err != nil {
		t.Fatalf("SHould have passed re-init ")
	}
	if rfp.ingressNeeded {
		t.Fatal("Ingress needed should now be false since filepath is set")
	}
	if rfp.filepath == "" {
		t.Fatal("Filepath should not be empty")
	}


}