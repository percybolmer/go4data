package readers

import (
	"bytes"
	"errors"
	"testing"
)

func TestInheritance(t *testing.T) {
	n := CsvRow{}

	if n.GetIngressChannel() != nil {
		t.Logf("%+v", n.GetEgressChannel())
	}
	t.Log("Seems unimplemented functions just return nil")
}
func TestParseCsv(t *testing.T) {
	r := NewCsvReader()
	badCsv := []string{"this is not csv"}
	concattedHeaders := []string{"this,is, start", "\n", "of, header", "\n", "this, is, the,value"}
	skipRow := []string{"rubbish stuff", "\n", "this,is,header", "\n", "value,is,here"}
	goodCsv := []string{"this,is,header", "\n", "value,is,here"}
	customDelim := []string{"this|is|header", "\n", "value|is|here"}
	type testCase struct {
		Name                 string
		Data                 []string
		Delimiter            string
		Headerlength         int
		ExpectedError        error
		ExpectedRecordLength int
		SkipRows             int
	}

	testcases := []testCase{
		{"NotCsv", badCsv, "", 1, ErrNotCsv, 0, 0},
		{"ConcattenatedHeader", concattedHeaders, "", 2, ErrHeaderMismatch, 0, 0},
		{"SkipRow", skipRow, "", 1, nil, 1, 1},
		{"Success", goodCsv, "", 1, nil, 1, 0},
		{"CustomDelimiter", customDelim, "|", 1, nil, 1, 0},
	}

	for _, tc := range testcases {
		r.SetHeaderLength(tc.Headerlength)
		r.SetSkipRows(tc.SkipRows)
		if tc.Delimiter != "" {
			r.SetDelimiter(tc.Delimiter)
		}
		var d bytes.Buffer
		for _, s := range tc.Data {
			d.WriteString(s)
		}

		results, err := r.ParseCsv(d.Bytes())
		if !errors.Is(err, tc.ExpectedError) {
			t.Fatalf("%s:%v", tc.Name, err)
		}

		if results != nil {
			if len(results) != tc.ExpectedRecordLength {
				t.Errorf("%s: Wrong length on the entreies result: %d", tc.Name, len(results))
			} else {
				t.Log(results)
			}
		}
	}

}

func TestGetPayload(t *testing.T) {
	n := CsvRow{}

	newPayload := make(map[string]string)
	newPayload["some"] = "value"
	newPayload["exists"] = "yeah"

	n.Payload = newPayload

	data := n.GetPayload()
	if n.Error() != nil {
		t.Fatal(n.Error())
	}

	t.Log(string(data))
}

func TestSetPayload(t *testing.T) {
	type testCase struct {
		Name          string
		Data          []byte
		ExpectedError bool
	}

	testCases := []testCase{
		{"Works", []byte(`{"some":"value", "existing":"json"}`), false},
		{"badjson", []byte(`{"some":""existing":"json"}`), true},
		{"notjson", []byte(`jahooo`), true},
	}

	for _, tc := range testCases {
		n := CsvRow{}
		n.SetPayload(tc.Data)
		if tc.ExpectedError && n.Error() == nil {
			t.Fatalf("%s: Should have found an error in this case", tc.Name)
		} else if !tc.ExpectedError && n.Error() != nil {
			t.Fatalf("%s: %s", tc.Name, n.Error().Error())
		}

	}
}
