package payloads

// BasePayload is a simple struct for processor to use if they dont have a custom payload
type BasePayload struct {
	Payload []byte `json:"payload"`
	Source  string `json:"-"`
}

// GetPayloadLength is used to get the number of bytes in a float
func (bp BasePayload) GetPayloadLength() float64 {
	return float64(len(bp.Payload))
}

// GetPayload will return a payload without any processing
func (bp BasePayload) GetPayload() []byte {
	return bp.Payload
}

// SetPayload changes the payload
func (bp BasePayload) SetPayload(p []byte) {
	bp.Payload = p
}

// GetSource returns the source of the payload
func (bp BasePayload) GetSource() string {
	return bp.Source
}

// SetSource will change the value of the payload source
func (bp BasePayload) SetSource(s string) {
	bp.Source = s
}
