package readers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/percybolmer/filewatcher"
	"github.com/percybolmer/workflow/flow"
)

const (
	// FileReaderType is a const representation of Payloads read through Files
	FileReaderType = "file"
)

var (
	//ErrInvalidPath is thrown when the path for a file is not correct
	ErrInvalidPath error = errors.New("The path provided is not a proper path to a file or directory")
)

//FileReader is used to read a file into payload
type FileReader struct {
	Path            string `json:"path"`
	RemoveAfterRead bool   `json:"removefiles"`
}

// ReadFile will read the bytes from a file and set them as the current payload
func ReadFile(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	fr := FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		inflow.Log(err)
		return
	}

	payload, err := fr.Read(fr.Path)
	if err != nil {
		inflow.Log(err)
		return
	}
	outChan := make(chan flow.Payload, 1)
	inflow.SetEgressChannel(outChan)

	output := &flow.BasePayload{}
	output.SetPayload(payload)
	output.SetSource(fr.Path)
	outChan <- output

}

// WriteFile will take a Flows Payload and write it to file
func WriteFile(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	fr := FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		inflow.Log(err)
		return
	}

	if fr.Path == "" {
		inflow.Log(ErrInvalidPath)
		return
	}
	outChan := make(chan flow.Payload)
	inflow.SetEgressChannel(outChan)
	wg := inflow.GetWaitGroup()
	go func() {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case newflow := <-inflow.GetIngressChannel():
				// @TODO add Epoch timestamp for unique names
				file := filepath.Base(newflow.GetSource())
				err := fr.WriteFile(fmt.Sprintf("%s/%s", fr.Path, file), newflow.GetPayload())
				if err != nil {
					inflow.Log(err)
					continue
				}
				outChan <- newflow
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}

// WriteFile is used to write payloads to files
func (fr *FileReader) WriteFile(path string, payload []byte) error {
	return ioutil.WriteFile(path, payload, 0644)
}

// MonitorDirectory is used to read from a directory for a given time
func MonitorDirectory(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()
	fr := FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		inflow.Log(err)
		return
	}
	// Make sure directory exists
	if _, err := os.Stat(fr.Path); os.IsNotExist(err) {
		inflow.Log(err)
		return
	}
	filechannel := make(chan string)
	watcher := filewatcher.NewFileWatcher()
	watcher.ChangeExecutionTime(1)

	wg := inflow.GetWaitGroup()

	go watcher.WatchDirectory(filechannel, fr.Path)
	folderPath := fr.Path
	egressChannel := make(chan flow.Payload)
	inflow.SetEgressChannel(egressChannel)
	// Start a goroutine to watch over the filechannel and Ingest the new Files
	go func(filechannel chan string, inflow *flow.Flow, egressChannel chan flow.Payload) {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case newFile := <-filechannel:
				filePath := fmt.Sprintf("%s/%s", folderPath, newFile)
				bytes, err := fr.Read(filePath)
				if err != nil {
					inflow.Log(err)
					continue
				}
				if len(bytes) != 0 {
					payload := &flow.BasePayload{}
					payload.SetSource(filePath)
					payload.SetPayload(bytes)
					egressChannel <- payload
				}
				if fr.RemoveAfterRead {
					os.Remove(filePath)
				}
			case <-inflow.StopChannel:
				return
			}

		}
	}(filechannel, inflow, egressChannel)
	return
}

// Read is used to read a file and return the Byte array of the value
func (fr *FileReader) Read(path string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if fr.RemoveAfterRead {
			os.Remove(path)
		}
	}()
	return ioutil.ReadAll(file)
}
