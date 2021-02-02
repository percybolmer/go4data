// Package payload contains Structs that fulfills payload interface
package payload

import (
	"strings"

	"github.com/percybolmer/go4data/property"
)

//CsvPayload is a struct representing Csv data as a map
//Its also a part of the Payload interface
type CsvPayload struct {
	Payload   string                  `json:"payload"`
	Header    string                  `json:"header"`
	Delimiter string                  `json:"delimiter"`
	Source    string                  `json:"source"`
	Error     error                   `json:"error"`
	Metadata  *property.Configuration `json:"metadata"`
}

// NewCsvPayload is used to Create a new Payload
func NewCsvPayload(header, payload, delimiter string, meta *property.Configuration) *CsvPayload {
	pay := &CsvPayload{
		Header:    header,
		Payload:   payload,
		Delimiter: delimiter,
	}
	if meta != nil {
		pay.Metadata = meta
	} else {
		pay.Metadata = property.NewConfiguration()
	}
	return pay

}

// ApplyFilter is used to make this part of the Filterable interface
func (nf *CsvPayload) ApplyFilter(f *Filter) bool {
	header := strings.Split(nf.Header, nf.Delimiter)
	values := strings.Split(nf.Payload, nf.Delimiter)

	if len(header) != len(values) {
		return false
	}

	for i, head := range header {
		if head == f.Key {
			return f.Regexp.MatchString(values[i])
		}
	}
	return false
}

// GetPayloadLength will return the payload X Bytes
func (nf *CsvPayload) GetPayloadLength() float64 {
	return float64(len(nf.Payload))
}

// GetPayload is used to return an actual value for the Flow
// Csv hedaer will be appended with a newline aswell
func (nf *CsvPayload) GetPayload() []byte {
	return []byte(nf.Header + "\n" + nf.Payload)
}

//SetPayload will change the value of the Flow
func (nf *CsvPayload) SetPayload(newpayload []byte) {
	nf.Payload = string(newpayload)
}

//GetSource will return the source of the flow
func (nf *CsvPayload) GetSource() string {
	return nf.Source
}

//SetSource will change the value of the configured source
//The source value should represent something that makes it possible to traceback
//Errors, so for files etc its the filename.
func (nf *CsvPayload) SetSource(s string) {
	nf.Source = s
}

// GetMetaData returns a configuration object that can be used to store metadata
func (nf *CsvPayload) GetMetaData() *property.Configuration {
	return nf.Metadata
}
