# Payload
Payload is a interface that is used to transfer data between processors.  
A payload is a interface to allow different data to be transferd based on the handlers.  

```golang
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
	// GetMetaData should return a configuration object that contains metadata about the payload
	GetMetaData() *property.Configuration
}
```
Currently available payloads are

| Payload | Description | Filterable |
| ------------- | ------------- | ------------- | 
| BasePayload  | A simple payload used by most handlers, it is used when transfering a []byte is enough  | false
| CsvPayload | A Csv payload that contains information about the csv header aswell as the delimiter to decode the payload | true
| NetworkPayload | A payload that holds network packets. The payload is a gopacket.Packet | false