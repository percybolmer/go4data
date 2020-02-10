package readers

import "encoding/json"

// Flow is a interface used to transmit data between Ingresses.
// It is used so that any struct that follows the interface can be passed between the different types of Readers etc.
// Its up to the Custom Follow on processors to make sure that the data received/sent is the same
type Flow interface {
	// GetIngressChannel is used to get the Egress Channel of the previous Flow
	GetIngressChannel() chan Flow
	// SetIngressChannel is used to set a new Channel for ingressing flows, This hsould be the previous channels Egress Channel
	// The Flows sent over this channel should have a Payload set
	SetIngressChannel(chan Flow)
	// GetEgressChannel is used to get a chan Flow as an egress for the Flow
	GetEgressChannel() chan Flow
	// SetEgressChannel is used to set a channel that the next processor can use to ingress wanted payloads
	SetEgressChannel(chan Flow)
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
	// GetType returns a string with the type of Ingress its from, etc redis quees will be "redis" or files will have "file"
	GetType() string
	// SetType will change the type
	SetType(string)
	// GetConfiguration will return whatever values are configured in the config
	// this is used by each processor the get the needed information
	GetConfiguration() json.RawMessage
	// SetConfiguration will change the flows configuration message
	SetConfiguration(json.RawMessage)
	//Log is used by each error to log any errors that occur, this is set by the workflow Config
	Log(error)
	// Error will return any logged error of the flow
	Error() error
}

// NewFlow is used to create a flow correct struct that can init a workflow process
type NewFlow struct {
	payload        []byte
	ingressChannel chan Flow
	egressChannel  chan Flow
	source         string
	processType    string
	err            error
	configuartion  json.RawMessage
}

// GetPayload is used to return an actual value for the Flow
func (nf *NewFlow) GetPayload() []byte {
	return nf.payload
}

//SetPayload will change the value of the Flow
func (nf *NewFlow) SetPayload(newpayload []byte) {
	nf.payload = newpayload
}

//GetIngressChannel is used by processors that require a continous flow of new flows,
//It should return a channel that will keep returning Flows for the duration of the Workflow duration
func (nf *NewFlow) GetIngressChannel() chan Flow {
	return nf.ingressChannel
}

// SetIngressChannel is used to set a new Channel for ingressing flows, This hsould be the previous channels Egress Channel
// The ingressChannel should commonly be set by the previous Flow executed
// and should be the previous flows EgressChannel
func (nf *NewFlow) SetIngressChannel(newchan chan Flow) {
	nf.ingressChannel = newchan
}

//GetEgressChannel will return a channel that reports Outgoing Flows from a Flow
func (nf *NewFlow) GetEgressChannel() chan Flow {
	return nf.egressChannel
}

//SetEgressChannel will change the egress channel into a new one
func (nf *NewFlow) SetEgressChannel(egress chan Flow) {
	nf.egressChannel = egress
}

//GetSource will return the source of the flow
func (nf *NewFlow) GetSource() string {
	return nf.source
}

//SetSource will change the value of the configured source
//The source value should represent something that makes it possible to traceback
//Errors, so for files etc its the filename.
func (nf *NewFlow) SetSource(s string) {
	nf.source = s
}

//GetType will retutrn the configured type, Type should be the processor name
func (nf *NewFlow) GetType() string {
	return nf.processType
}

//SetType is used to change the value of a type
func (nf *NewFlow) SetType(s string) {
	nf.processType = s
}

//GetConfiguration will return a raw JSON to be Unmarshalled into propriate struct
func (nf *NewFlow) GetConfiguration() json.RawMessage {
	return nf.configuartion
}

//SetConfiguration is a way to change the Configs
func (nf *NewFlow) SetConfiguration(conf json.RawMessage) {
	nf.configuartion = conf
}

//Log should store the error into the configured Logging mechanism
//Should be changed from single value to Channel I guess.
func (nf *NewFlow) Log(err error) {
	nf.err = err
}

//Error will return the next error in triggerd
func (nf *NewFlow) Error() error {
	return nf.err
}
