package workflow

// Payload is a interface that will allows different Processors to send data between them in a unified fashion
type Payload interface {
	// GetPayloadLength returns the payload length in flota64
	GetPayloadLength() float64
	// GetPayload will return a byte array with the Payload from the ingress
	// Payload should be limited to 512 MB since thats the MAX cap for a redis payload
	// Also note that JSON payloads will be base64 encoded
	GetPayload() []byte
	// SetPayload will change the values of the payload
	SetPayload([]byte)
	// GetSource should return a string containing the name of the source, etc for a file its the filename or the recdis queue topic
	GetSource() string
	// SetSource should change the value of the source
	SetSource(string)
}

// BasePayload is a simple struct for processor to use if they dont have a custom payload
type BasePayload struct {
	Payload []byte `json:"payload"`
	Source  string `json:"-"`
}

// GetPayloadLength is used to get the number of bytes in a float
func (bp BasePayload) GetPayloadLength() float64 {
	return float64(len(bp.Payload))
}

// GetPayload will return a payload witouth any processing
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

// SetSource will change the value of the payload osurce
func (bp BasePayload) SetSource(s string) {
	bp.Source = s
}
