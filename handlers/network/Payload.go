package network

import (
	"errors"

	"github.com/google/gopacket"
	"github.com/percybolmer/workflow/payload"
)

var (
	// ErrPayloadIsNotANetworkPayload is when trying to convert a payload that does not fit the Payload of Network package
	ErrPayloadIsNotANetworkPayload = errors.New("this payload does not match the network.Payload type")
)

//Payload is a struct representing pcap.PacketSource as payload
//Its also a part of the Payload interface
type Payload struct {
	Payload []gopacket.Packet `json:"payload"`
	Source  string            `json:"source"`
	Error   error             `json:"error"`
}

// NewPayload is used to convert a regular payload into a network payload
func NewPayload(pay payload.Payload) (*Payload, error) {
	conv, ok := pay.(*Payload)
	if ok {
		return conv, nil
	}
	return nil, ErrPayloadIsNotANetworkPayload
}

// GetPayloadLength will return the payload X Bytes
func (nf *Payload) GetPayloadLength() float64 {
	return float64(len(nf.Payload))
}

// GetPayload is used to return an actual value for the Flow
func (nf *Payload) GetPayload() []byte {
	return nil
}

//SetPayload will change the value of the Flow
func (nf *Payload) SetPayload(newpayload []byte) {
}

//GetSource will return the source of the flow
func (nf *Payload) GetSource() string {
	return nf.Source
}

//SetSource will change the value of the configured source
//The source value should represent something that makes it possible to traceback
//Errors, so for files etc its the filename.
func (nf *Payload) SetSource(s string) {
	nf.Source = s
}
