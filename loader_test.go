package workflow

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/percybolmer/workflow/handlers/files"
)

func generateProcs(t *testing.T) []*Processor {
	listDirProc := NewProcessor("listdir", "found_files")
	readFileProc := NewProcessor("readfile", "file_data")
	listDirProc.SetHandler(files.NewListDirectoryHandler())
	readFileProc.SetHandler(files.NewReadFileHandler())

	cfg := listDirProc.GetConfiguration()
	err := cfg.SetProperty("path", "testing")
	if err != nil {
		t.Fatal(err)
	}
	err = cfg.SetProperty("buffertime", 2)
	if err != nil {
		t.Fatal(err)
	}

	readFileProc.GetConfiguration().SetProperty("remove_after", false)
	readFileProc.Subscribe("found_files")

	processors := make([]*Processor, 2)
	processors[0] = listDirProc
	processors[1] = readFileProc

	return processors
}
func TestSave(t *testing.T) {
	procs := generateProcs(t)
	err := Save("testing/loader/save.yml", procs)
	if err != nil {
		t.Fatal(err)
	}
	os.Remove("testing/loader/save.yml")

}

func TestLoad(t *testing.T) {
	procs := generateProcs(t)

	loaders := make([]*LoaderProccessor, 0)
	for _, proc := range procs {
		proc.Running = true
		loaders = append(loaders, proc.ConvertToLoader())
	}
	Save("testing/loader/loadthis.yml", loaders)

	loaded, err := Load("testing/loader/loadthis.yml")
	if err != nil {
		t.Fatal(err)
	}
	// Since we forced Running to be true for the procs, we should now be able to fetch data from file_data topic with stdout proc
	time.Sleep(1 * time.Second)

	mets := loaded[1].Metric.GetMetrics()
	payin := fmt.Sprintf("%s_%d_payloads_in", loaded[1].Name, loaded[1].ID)

	if mets[payin] == nil {
		t.Fatal("ReadFile proc should have atleast 1 input")
	}

	_, err = Load("nosuchfile")
	if err == nil {
		t.Fatal("Should have failed to load this")
	}
}

func TestLoadMap(t *testing.T) {

	loaded, err := Load("testing/loader/loadMap.yml")
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("%+v", loaded)
}

func TestLoadSlice(t *testing.T) {

	loaded, err := Load("testing/loader/loadSlice.yml")
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("%+v", loaded)
}
