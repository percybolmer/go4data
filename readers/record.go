package readers

// Flow is a interface used to transmit data between Ingresses.
// It is used so that any struct that follows the interface can be passed between the different types of Readers etc.
// Its up to the Custom Follow on processors to make sure that the data received/sent is the same
type Flow interface {
	// GetPayload will return a byte array with the Payload from the ingress
	// Payload should be limited to 512 MB since thats the MAX cap for a redis payload
	// Also note that JSON payloads will be base64 encoded
	GetPayload() []byte
	// GetSource should return a string containing the name of the source, etc for a file its the filename or the recdis queue topic
	GetSource() string
	// GetType returns a string with the type of Ingress its from, etc redis quees will be "redis" or files will have "file"
	GetType() string
}
