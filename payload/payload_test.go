package payload

import (
	"testing"
)

func TestCSVPayload(t *testing.T) {
	var _ Payload = (*CsvPayload)(nil)

}

func TestNetworkPayload(t *testing.T) {
	var _ Payload = (*NetworkPayload)(nil)

}

func TestBasePayload(t *testing.T) {
	var _ Payload = (*BasePayload)(nil)

}
