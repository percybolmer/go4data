package readers

import (
	"encoding/json"
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

func TestWriteIndex(t *testing.T) {
	addresses := make([]string, 0)
	addresses = append(addresses, "http://127.0.0.1:9200")

	ereader, err := NewElasticReader(addresses, "", "")

	type marshalthis struct {
		Text   string `json:"text"`
		Number int    `json:"number"`
	}
	mt := marshalthis{
		Text:   "hello world",
		Number: 2,
	}

	d, err := json.Marshal(mt)

	err = ereader.WriteIndex("devel_test", d)

	if err != nil {
		t.Fatal("Should have been able to write to index on localhost", err.Error())
	}
}
