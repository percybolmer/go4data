package readers

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"testing"
)

type TestStruct struct {
	Name string `csv:"name"`
	Age  int    `csv:"age"`
}

func (t TestStruct) String() string {
	return ""
}

func TestMonitorDirectory(t *testing.T) {
	// this test is a super bad example, change this ASAP to testcases and do some valid testing
	// this test was only written to see if it actually works
	r := NewCsvReader()
	records := make(chan Flow)
	errors := make(chan error)
	r.MonitorDirectory("/development/go/github.com/percybolmer/csvingester/monitor/", records, errors)
	for {
		select {
		case newRecords := <-records:
			fmt.Println(newRecords)
		case newError := <-errors:
			fmt.Println(newError)
		}
	}
}
func TestRead(t *testing.T) {

	r := NewCsvReader()
	type testCase struct {
		Name                 string
		Path                 string
		Delimiter            string
		Headerlength         int
		ExpectedError        error
		ExpectedRecordLength int
		SkipRows             int
	}

	testcases := []testCase{
		{"NoFile", "nosuchfile.csv", "", 1, os.ErrNotExist, 0, 0},
		{"NotCsv", "testfiles/notcsv.json", "", 1, ErrNotCsv, 0, 0},
		{"ConcattenatedHeader", "testfiles/multiheader.csv", "", 2, ErrHeaderMismatch, 0, 0},
		{"SkipRow", "testfiles/skiprow.csv", "", 1, nil, 1, 5},
		{"Success", "testfiles/data.csv", "", 1, nil, 2, 0},
		{"CustomDelimiter", "testfiles/customdelimiter.csv", "|", 1, nil, 2, 0},
	}

	for _, tc := range testcases {
		r.SetHeaderLength(tc.Headerlength)
		r.SetSkipRows(tc.SkipRows)
		if tc.Delimiter != "" {
			r.SetDelimiter(tc.Delimiter)
		}
		result, err := r.Read(tc.Path)
		if !errors.Is(err, tc.ExpectedError) {
			t.Fatalf("%s:%v", tc.Name, err)
		}
		if result != nil {
			results := make([]map[string]string, 0)
			err := json.Unmarshal(result.GetPayload(), &results)
			if err != nil {
				t.Fatalf("%s:%v", tc.Name, err)
			}
			if len(results) != tc.ExpectedRecordLength {
				t.Errorf("%s: Wrong length on the entries result : %d", tc.Name, len(results))
			} else {
				t.Log(results)
			}
		}
	}

}
