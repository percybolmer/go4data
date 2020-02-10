package readers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/percybolmer/filewatcher"
)

const (
	// FileReaderType is a const representation of Payloads read through Files
	FileReaderType = "file"
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
	payload, err := fr.Read()
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
				fr := FileReader{
					Path: filePath,
				}
				bytes, err := fr.Read()
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
func (f *FileReader) Read() ([]byte, error) {
	file, err := os.Open(f.Path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if f.RemoveAfterRead {
			os.Remove(f.Path)
		}
	}()
	return ioutil.ReadAll(file)
}
