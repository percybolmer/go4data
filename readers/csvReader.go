//Package readers handles in files
// CsvReader Reads CSV files and making a allowing users
// to configure Flows of these CSV Entries, it can be running the CSV through a certain parser, db ingester or any task wanted
// It will only be able at version 1 to be able to run Binarys on the Entries, or bulk
package readers

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/percybolmer/filewatcher"
)

var (
	//ErrNotCsv is triggerd when the input file is not proper csv
	ErrNotCsv error = errors.New("This is not a proper csv file")
	//ErrHeaderMismatch is triggerd when header is longer than CSV records
	ErrHeaderMismatch error = errors.New("The header is not the same size as the records")
)

const (
	// CsvType is used as a way for the Flow to known the origin of  the information
	CsvType = "csv"
)

// CsvReader is a tool to ingest CSV files and split up the entries
type CsvReader struct {
	// HeaderLength sets how many lines of the file is a header, default is 1
	HeaderLength int
	// SkipRows will skip rows before reading a header, this is so that we can handle files with Junk b4 header, defaults to 0
	SkipRows int
	// Delimiter is a string that can be used to split on, change this to wanted CSV string
	Delimiter string
	//RemoveIngested is a bool that will trigger a removal of the files that are ingested, deafults to false
	RemoveIngested bool
}

//NewCsvReader will init the reader with default values, use this to create a new reader to avoid strange behaviour
func NewCsvReader() *CsvReader {
	return &CsvReader{
		HeaderLength:   1,
		SkipRows:       0,
		Delimiter:      ",",
		RemoveIngested: false,
	}
}

// csvMsg is the flow handler for csv queue msgs
type csvMsg struct {
	Payload []byte `json:"payload"`
	Source  string `json:"source"`
	T       string `json:"type"`
}

// Type will return type
func (cm *csvMsg) GetType() string {
	return CsvType
}

// Source will return the source of the redis queue
func (cm *csvMsg) GetSource() string {
	return cm.Source
}

// Payload will return the payload of the redis msg
func (cm *csvMsg) GetPayload() []byte {
	return cm.Payload
}

// SetDelimiter will change the readers delimiter that is used to parse files
func (r *CsvReader) SetDelimiter(d string) {
	r.Delimiter = d
}

//SetHeaderLength will change how many rows are considerd part of the header
func (r *CsvReader) SetHeaderLength(i int) {
	r.HeaderLength = i
}

//SetSkipRows will skip N number of rows before reading headerline
func (r *CsvReader) SetSkipRows(i int) {
	r.SkipRows = i
}

// SetRemoveIngested will make the reader delete the files that are found after ingestion
func (r *CsvReader) SetRemoveIngested(b bool) {
	r.RemoveIngested = b
}

//MonitorDirectory is used to constantly monitor a directory for new files and read them as CSV files
//It accepts 2 channels to send records and errors
//It will send an os.IsNotExist if the directory is not found on the channel
func (r *CsvReader) MonitorDirectory(path string, resultChan chan<- Flow, errChan chan<- error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		errChan <- err
		return
	}

	filechannel := make(chan string)
	watcher := filewatcher.NewFileWatcher()
	watcher.ChangeExecutionTime(1)

	go watcher.WatchDirectory(filechannel, path)
	// Start a goroutine to watch over the filechannel and Ingest the new Files
	go func(filechannel chan string, recordChannel chan<- Flow, errorChannel chan<- error) {
		for {
			select {
			case newFile := <-filechannel:
				filePath := fmt.Sprintf("%s/%s", path, newFile)
				records, err := r.Read(filePath)
				if err != nil {
					errorChannel <- err
					continue
				}
				if records != nil {
					recordChannel <- records
				}
				if r.RemoveIngested {
					os.Remove(filePath)
				}
			}
		}
	}(filechannel, resultChan, errChan)
}

// Read will open a file and return all the entries inside
// It will take care of configured SkippedRows, read in MultiLine headers and also The following records.
func (r *CsvReader) Read(path string) (Flow, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() {
		file.Close()
		if r.RemoveIngested {
			os.Remove(path)
		}
	}()

	scanner := bufio.NewScanner(file)
	var index int
	// Get file name by getting the last / of the string, is there a better way?
	originalName := filepath.Base(file.Name())
	result := &csvMsg{
		Source: originalName,
		T:      CsvType,
	}
	records := make([]map[string]string, 0)
	header := make([]string, 0)
	for scanner.Scan() {
		line := scanner.Text()
		// Handle skip rows
		if index < r.SkipRows {
			index++
			continue
		}
		// Handle header rows
		values := strings.Split(line, r.Delimiter)
		if len(values) <= 1 {
			return nil, fmt.Errorf("%s:%w", err, ErrNotCsv)
		}
		if index < (r.SkipRows + r.HeaderLength) {
			header = append(header, values...)
			index++
			continue
		}
		// Make sure header is the same length aas values
		if len(header) != len(values) {
			return nil, ErrHeaderMismatch
		}
		// Handle new records

		payload := make(map[string]string, len(values))
		for i, value := range values {
			payload[header[i]] = value
		}
		records = append(records, payload)

	}
	// add records as payload
	data, err := json.Marshal(&records)
	if err != nil {
		return nil, err
	}
	result.Payload = data
	return result, nil
}
