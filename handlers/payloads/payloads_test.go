package payloads

import (
	"testing"

	"github.com/percybolmer/workflow/payload"
)

func TestParseCSVROWPayload(t *testing.T) {
	var _ payload.Payload = (*CsvRow)(nil)

}
