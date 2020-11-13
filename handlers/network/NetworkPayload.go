package network

import (
	"github.com/google/gopacket"
)

//NetworkPayload is a struct representing pcap.PacketSource as payload
//Its also a part of the Payload interface
type NetworkPayload struct {
	Payload *gopacket.PacketSource `json:"payload"`
	Source  string                 `json:"source"`
	Error   error                  `json:"error"`
}

// GetPayloadLength will return the payload X Bytes
func (nf *NetworkPayload) GetPayloadLength() float64 {
	return len(nf.Payload.Packets())
}

// GetPayload is used to return an actual value for the Flow
func (nf *NetworkPayload) GetPayload() []byte {
	return nil
}

//SetPayload will change the value of the Flow
func (nf *NetworkPayload) SetPayload(newpayload []byte) {
	return nil
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
