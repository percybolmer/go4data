package readers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"strings"

	"github.com/percybolmer/workflow/flow"
)

// CsvReader Reads CSV flows
// and converts the CSV into a map[string]string where the key is the value from the header
var (
	//ErrNotCsv is triggerd when the input file is not proper csv
	ErrNotCsv error = errors.New("This is not a proper csv file")
	//ErrHeaderMismatch is triggerd when header is longer than CSV records
	ErrHeaderMismatch error = errors.New("The header is not the same size as the records")
	//ErrNeedAnIngressChannel is triggerd when trying to run a processor that needs a ingress channel
	ErrNeedAnIngressChannel error = errors.New("There is no ingress channel configured, its needed for this processor")
)

const (
	// CsvType is used as a way for the Flow to known the origin of  the information
	CsvType = "csv"
)

// CsvReader is a tool to ingest CSV payloads and split up the entries
type CsvReader struct {
	// HeaderLength sets how many lines of the file is a header, default is 1
	HeaderLength int `json:"headerlength"`
	// SkipRows will skip rows before reading a header, this is so that we can handle files with Junk b4 header, defaults to 0
	SkipRows int `json:"skiprows"`
	// Delimiter is a string that can be used to split on, change this to wanted CSV string
	Delimiter string `json:"delimiter"`
}

//NewCsvReader will init the reader with default values, use this to create a new reader to avoid strange behaviour
func NewCsvReader() *CsvReader {
	return &CsvReader{
		HeaderLength: 1,
		SkipRows:     0,
		Delimiter:    ",",
	}
}

// SetDelimiter will change the readers delimiter that is used to parse files
func (cr *CsvReader) SetDelimiter(d string) {
	cr.Delimiter = d
}

//SetHeaderLength will change how many rows are considerd part of the header
func (cr *CsvReader) SetHeaderLength(i int) {
	cr.HeaderLength = i
}

//SetSkipRows will skip N number of rows before reading headerline
func (cr *CsvReader) SetSkipRows(i int) {
	cr.SkipRows = i
}

// ParseCsvFlow is used to parse a CsvFlow
// It will output a new Flow with a EgressChannel setup that all csvRows will be sent to
// as separate Flows
func ParseCsvFlow(f *flow.Flow) chan flow.Payload {
	cr := NewCsvReader()
	err := json.Unmarshal(f.GetConfiguration(), cr)
	if err != nil {
		f.Log(err)
		return nil
	}
	// Should I handle both Flows that are single source and Egress?
	// Or remove Single source flows alltogether?
	ingress := f.GetIngressChannel()
	if ingress == nil {
		f.Log(ErrNeedAnIngressChannel)
		return nil
	}

	egressChannel := make(chan flow.Payload)
	go func() {
		for {
			select {
			case newinput := <-ingress:
				rows, err := cr.ParseCsv(newinput.GetPayload())
				if err != nil {
					f.Log(err)
					continue
				}
				// Each row is going to become its own output Flow on egressChannel
				if len(rows) != 0 {
					for _, payload := range rows {
						payload.SetSource(newinput.GetSource())
						egressChannel <- payload
					}

				}
			}
		}
	}()
	return egressChannel

}

// ParseCsv will take the payload expecting a byte array of a CSV file
// it will return a slice of all the rows found
func (cr *CsvReader) ParseCsv(payload []byte) ([]*CsvRow, error) {
	//reader := bytes.NewReader(payload)
	buf := bytes.NewBuffer(payload)
	scanner := bufio.NewScanner(buf)
	// index keeps track of line index
	var index int

	header := make([]string, 0)
	result := make([]*CsvRow, 0)
	for scanner.Scan() {
		line := scanner.Text()
		// Handle skip rows
		if index < cr.SkipRows {
			index++
			continue
		}

		// Handle header rows
		values := strings.Split(line, cr.Delimiter)
		if len(values) <= 1 {
			return nil, ErrNotCsv
		}
		// handle unique cases of multiline headers
		if index < (cr.SkipRows + cr.HeaderLength) {
			header = append(header, values...)
			index++
			continue
		}
		// Make sure header is the same length as values
		if len(header) != len(values) {
			return nil, ErrHeaderMismatch
		}

		// Handle new rows
		newRow := &CsvRow{
			Payload: make(map[string]string, len(values)),
		}

		for i, value := range values {
			newRow.Payload[header[i]] = value
		}
		result = append(result, newRow)
	}

	return result, nil

}

//CsvRow is a struct representing Csv data as a map
//Its also a part of the FLow interface
type CsvRow struct {
	Payload map[string]string `json:"payload"`
	Source  string            `json:"source"`
	Error   error             `json:"error"`
}

// GetPayload is used to return an actual value for the Flow
func (nf *CsvRow) GetPayload() []byte {
	data, err := json.Marshal(nf.Payload)
	if err != nil {
		nf.Error = err
	}
	return data
}

//SetPayload will change the value of the Flow
func (nf *CsvRow) SetPayload(newpayload []byte) {
	nf.Error = json.Unmarshal(newpayload, &nf.Payload)
}

//GetSource will return the source of the flow
func (nf *CsvRow) GetSource() string {
	return nf.Source
}

//SetSource will change the value of the configured source
//The source value should represent something that makes it possible to traceback
//Errors, so for files etc its the filename.
func (nf *CsvRow) SetSource(s string) {
	nf.Source = s
}
