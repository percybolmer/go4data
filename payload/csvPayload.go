// Package payload contains Structs that fulfills payload interface
package payload

import (
	"strings"

	"github.com/percybolmer/workflow/handlers/filters"
	"github.com/percybolmer/workflow/property"
)

//CsvRow is a struct representing Csv data as a map
//Its also a part of the Payload interface
type CsvRow struct {
	Payload   string                  `json:"payload"`
	Header    string                  `json:"header"`
	Delimiter string                  `json:"delimiter"`
	Source    string                  `json:"source"`
	Error     error                   `json:"error"`
	Metadata  *property.Configuration `json:"metadata"`
}

// ApplyFilter is used to make this part of the Filterable interface
func (nf *CsvRow) ApplyFilter(f *filters.Filter) bool {
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
func (nf *CsvRow) GetPayloadLength() float64 {
	return float64(len(nf.Payload))
}

// GetPayload is used to return an actual value for the Flow
// Csv hedaer will be appended with a newline aswell
func (nf *CsvRow) GetPayload() []byte {
	return []byte(nf.Header + "\n" + nf.Payload)
}

//SetPayload will change the value of the Flow
func (nf *CsvRow) SetPayload(newpayload []byte) {
	nf.Payload = string(newpayload)
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

// GetMetaData returns a configuration object that can be used to store metadata
func (nf *CsvRow) GetMetaData() *property.Configuration {
	return nf.Metadata
}
