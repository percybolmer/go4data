package payload

import (
	"encoding/json"

	"github.com/percybolmer/go4data/property"
)

// BasePayload is a simple struct for processor to use if they dont have a custom payload
type BasePayload struct {
	Payload  []byte                  `json:"payload"`
	Source   string                  `json:"source"`
	Metadata *property.Configuration `json:"metadata"`
}

// NewBasePayload will spawn a basic default payload
func NewBasePayload(payload []byte, source string, meta *property.Configuration) *BasePayload {
	pay := &BasePayload{
		Payload: payload,
		Source:  source,
	}
	if meta != nil {
		pay.Metadata = meta
	} else {
		pay.Metadata = property.NewConfiguration()
	}
	return pay
}

// MarshalBinary is used to marshal the whole payload into a Byte array
// This is particullary used to enable Redis Pub/Sub
func (bp *BasePayload) MarshalBinary() ([]byte, error) {
	return json.Marshal(bp)
}

// UnmarshalBinary is used to Decode a byte array into the proper fields
// In base payloads case its simple JSON
func (bp *BasePayload) UnmarshalBinary(data []byte) error {
	if err := json.Unmarshal(data, bp); err != nil {
		return err
	}
	return nil
}

// ApplyFilter is used to make it part of the filterable interface
func (bp *BasePayload) ApplyFilter(f *Filter) bool {
	return f.Regexp.Match(bp.GetPayload())
}

// GetPayloadLength is used to get the number of bytes in a float
func (bp *BasePayload) GetPayloadLength() float64 {
	return float64(len(bp.Payload))
}

// GetPayload will return a payload without any processing
func (bp *BasePayload) GetPayload() []byte {
	return bp.Payload
}

// SetPayload changes the payload
func (bp *BasePayload) SetPayload(p []byte) {
	bp.Payload = p
}

// GetSource returns the source of the payload
func (bp *BasePayload) GetSource() string {
	return bp.Source
}

// SetSource will change the value of the payload source
func (bp *BasePayload) SetSource(s string) {
	bp.Source = s
}

// GetMetaData returns a configuration object that can be used to store metadata
func (bp *BasePayload) GetMetaData() *property.Configuration {
	return bp.Metadata
}
