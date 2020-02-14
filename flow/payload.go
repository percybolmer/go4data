package flow

// Payload is a interface that will allows different Processors to send data between them in a orderly fashion
type Payload interface {
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

// GetPayload will return a payload witouth any processing
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

// SetSource will change the value of the payload osurce
func (bp *BasePayload) SetSource(s string) {
	bp.Source = s
}
