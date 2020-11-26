package payload

import (
	"regexp"
	"testing"
)

func TestNewCsvPayload(t *testing.T) {
	csv := NewCsvPayload("hello,this", "data,auch", ",", nil)

	if csv.GetMetaData() == nil {
		t.Fatal("Meta should not be nil")
	}

	if csv.Header != "hello,this" || csv.Payload != "data,auch" || csv.Delimiter != "," {
		t.Fatal("All values not assigned")
	}
}

func TestApplyFilter(t *testing.T) {
	csv := NewCsvPayload("hello,this", "data,auch", ",", nil)

	nomatchcsv := NewCsvPayload("hello,this", "nop,auch", ",", nil)

	reg, err := regexp.Compile("data")
	if err != nil {
		t.Fatal(err)
	}
	f := &Filter{
		GroupName: "test",
		Key:       "hello",
		Regexp:    reg,
	}
	if !csv.ApplyFilter(f) {
		t.Fatal("Should succeed in apply filter")
	} else if nomatchcsv.ApplyFilter(f) {
		t.Fatal("Should dismiss this CSV")
	}

}

func TestCSVGettersAndSetters(t *testing.T) {
	csv := NewCsvPayload("hello,this", "data,auch", ",", nil)

	length := csv.GetPayloadLength()

	if length != 9 {
		t.Fatal("Wrong length")
	}
	csv.SetPayload([]byte("test"))
	data := csv.GetPayload()
	if string(data) != "hello,this\ntest" {
		t.Fatal("Wrong data")
	}

	csv.SetSource("test")
	if csv.GetSource() != "test" {
		t.Fatal("Wrong source")
	}
}
