package readers

import (
	"testing"
)

func TestNewElasticReader(t *testing.T) {

	addresses := make([]string, 0)
	addresses = append(addresses, "http://127.0.0.1:9200")

	noaddresses := make([]string, 0)

	_, err := NewElasticReader(addresses, "", "")

	if err != nil {
		t.Fatal("Should be able to reach local ElasticSearch for this test")
	}

	_, err = NewElasticReader(noaddresses, "", "")

	if err == nil {
		t.Fatal("Should report errors if no connect can be established")
	}
}
