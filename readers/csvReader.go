package readers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"strings"
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
func ParseCsvFlow(f Flow) Flow {
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

	egressChannel := make(chan Flow)
	outputFlow := &NewFlow{}
	outputFlow.SetEgressChannel(egressChannel)
	outputFlow.SetType(CsvType)

	go func() {
		for {
			select {
			case newinput := <-ingress:
				rows, err := cr.ParseCsv(newinput.GetPayload())
				if err != nil {
					// Push this error to outputFlow or?
					outputFlow.Log(err)
					continue
				}
				// Each row is going to become its own output Flow on egressChannel
				if len(rows) != 0 {
					for _, row := range rows {
						payload := &NewFlow{}
						payload.SetSource(newinput.GetSource())
						payload.SetType(CsvType)
						payload.SetPayload(row.GetPayload())
						outputFlow.GetEgressChannel() <- payload
					}

				}
			}
		}
	}()
	return outputFlow

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
	Payload     map[string]string `json:"payload"`
	Source      string            `json:"source"`
	ProcessType string            `json:"type"`
	Err         error             `json:"error"`
}

// GetPayload is used to return an actual value for the Flow
func (nf *CsvRow) GetPayload() []byte {
	data, err := json.Marshal(nf.Payload)
	if err != nil {
		nf.Log(err)
	}
	return data
}

//SetPayload will change the value of the Flow
func (nf *CsvRow) SetPayload(newpayload []byte) {
	nf.Log(json.Unmarshal(newpayload, &nf.Payload))
}

//GetIngressChannel is used by processors that require a continous flow of new flows,
//It should return a channel that will keep returning Flows for the duration of the Workflow duration
func (nf *CsvRow) GetIngressChannel() chan Flow {
	return nil
}

// SetIngressChannel is used to set a new Channel for ingressing flows, This hsould be the previous channels Egress Channel
// The ingressChannel should commonly be set by the previous Flow executed
// and should be the previous flows EgressChannel
func (nf *CsvRow) SetIngressChannel(newchan chan Flow) {
}

//GetEgressChannel will return a channel that reports Outgoing Flows from a Flow
func (nf *CsvRow) GetEgressChannel() chan Flow {
	return nil
}

//SetEgressChannel will change the egress channel into a new one
func (nf *CsvRow) SetEgressChannel(egress chan Flow) {
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

//GetType will retutrn the configured type, Type should be the processor name
func (nf *CsvRow) GetType() string {
	return nf.ProcessType
}

//SetType is used to change the value of a type
func (nf *CsvRow) SetType(s string) {
	nf.ProcessType = s
}

//GetConfiguration will return a raw JSON to be Unmarshalled into propriate struct
func (nf *CsvRow) GetConfiguration() json.RawMessage {
	return nil
}

//SetConfiguration is a way to change the Configs
func (nf *CsvRow) SetConfiguration(conf json.RawMessage) {
}

//Log should store the error into the configured Logging mechanism
//Should be changed from single value to Channel I guess.
func (nf *CsvRow) Log(err error) {
	nf.Err = err
}

//Error will return the next error in triggerd
func (nf *CsvRow) Error() error {
	return nf.Err
}
