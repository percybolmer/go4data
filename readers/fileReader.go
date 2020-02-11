package readers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/percybolmer/filewatcher"
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
func ReadFile(flow Flow) Flow {
	confByte := flow.GetConfiguration()

	fr := FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		flow.Log(err)
		return nil
	}

	payload, err := fr.Read(fr.Path)
	if err != nil {
		flow.Log(err)
		return nil
	}
	output := &NewFlow{}
	output.SetPayload(payload)
	output.SetSource(fr.Path)
	output.SetType(FileReaderType)

	return output

}

// WriteFile will take a Flows Payload and write it to file
func WriteFile(flow Flow) Flow {
	confByte := flow.GetConfiguration()

	fr := FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		flow.Log(err)
		return nil
	}

	if fr.Path == "" {
		flow.Log(ErrInvalidPath)
		return nil
	}
	for {
		select {
		case newflow := <-flow.GetIngressChannel():
			// @TODO add Epoch timestamp for unique names
			err := fr.WriteFile(fmt.Sprintf("%s/%s", fr.Path, newflow.GetSource()), flow.GetPayload())

			if err != nil {
				newflow.Log(err)
				continue
			}
		}
	}
}

// WriteFile is used to write payloads to files
func (fr *FileReader) WriteFile(path string, payload []byte) error {
	return ioutil.WriteFile(path, payload, 0644)
}

// MonitorDirectory is used to read from a directory for a given time
func MonitorDirectory(flow Flow) Flow {
	confByte := flow.GetConfiguration()
	fr := FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		flow.Log(err)
		return nil
	}
	// Make sure directory exists
	if _, err := os.Stat(fr.Path); os.IsNotExist(err) {
		flow.Log(err)
		return nil
	}
	filechannel := make(chan string)
	watcher := filewatcher.NewFileWatcher()
	watcher.ChangeExecutionTime(1)

	go watcher.WatchDirectory(filechannel, fr.Path)
	folderPath := fr.Path
	egressChannel := make(chan Flow)
	outputFlow := &NewFlow{}
	outputFlow.SetEgressChannel(egressChannel)
	outputFlow.SetType(FileReaderType)
	// Start a goroutine to watch over the filechannel and Ingest the new Files
	go func(filechannel chan string, flow Flow, outputFlow Flow) {
		for {
			select {
			case newFile := <-filechannel:
				filePath := fmt.Sprintf("%s/%s", folderPath, newFile)
				bytes, err := fr.Read(filePath)
				if err != nil {
					flow.Log(err)
					continue
				}
				if len(bytes) != 0 {
					payload := &NewFlow{}
					payload.SetSource(filePath)
					payload.SetType(FileReaderType)
					payload.SetPayload(bytes)
					outputFlow.GetEgressChannel() <- payload
				}
				if fr.RemoveAfterRead {
					os.Remove(filePath)
				}
			}
		}
	}(filechannel, flow, outputFlow)
	return outputFlow
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
