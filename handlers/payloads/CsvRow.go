// Package payloads contains Structs that fulfills payload interface
package payloads

//CsvRow is a struct representing Csv data as a map
//Its also a part of the Payload interface
type CsvRow struct {
	Payload   string `json:"payload"`
	Header    string `json:"header"`
	Delimiter string `json:"delimiter"`
	Source    string `json:"source"`
	Error     error  `json:"error"`
}

// GetPayloadLength will return the payload X Bytes
func (nf *CsvRow) GetPayloadLength() float64 {
	return float64(len(nf.Payload))
}

// GetPayload is used to return an actual value for the Flow
func (nf *CsvRow) GetPayload() []byte {
	return []byte(nf.Payload)
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
