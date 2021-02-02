package payload

import (
	"errors"

	"github.com/google/gopacket"
	"github.com/percybolmer/go4data/property"
)

var (
	// ErrPayloadIsNotANetworkPayload is when trying to convert a payload that does not fit the Payload of Network package
	ErrPayloadIsNotANetworkPayload = errors.New("this payload does not match the network.Payload type")
)

//NetworkPayload is a struct representing pcap.PacketSource as NetworkPayload
//Its also a part of the Payload interface
type NetworkPayload struct {
	Payload  gopacket.Packet         `json:"payload"`
	Source   string                  `json:"source"`
	Error    error                   `json:"error"`
	Metadata *property.Configuration `json:"-"`
}

// NewNetworkPayload is used to convert a regular payload into a network payload
func NewNetworkPayload(pay Payload) (*NetworkPayload, error) {
	conv, ok := pay.(*NetworkPayload)
	if ok {
		return conv, nil
	}
	return nil, ErrPayloadIsNotANetworkPayload
}

// GetPayloadLength will return the payload X Bytes
func (nf *NetworkPayload) GetPayloadLength() float64 {
	if nf.Payload == nil {
		return 0
	}
	return float64(len(nf.Payload.ApplicationLayer().Payload()))
}

// GetPayload is used to return an actual value for the Flow
func (nf *NetworkPayload) GetPayload() []byte {
	return nil
}

//SetPayload will change the value of the Flow
func (nf *NetworkPayload) SetPayload(newpayload []byte) {
}

//GetSource will return the source of the flow
func (nf *NetworkPayload) GetSource() string {
	return nf.Source
}

//SetSource will change the value of the configured source
//The source value should represent something that makes it possible to traceback
//Errors, so for files etc its the filename.
func (nf *NetworkPayload) SetSource(s string) {
	nf.Source = s
}

// GetMetaData returns a configuration object that can be used to store metadata
func (nf *NetworkPayload) GetMetaData() *property.Configuration {
	return nf.Metadata
}
