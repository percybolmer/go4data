package fileprocessors

import (
    "bytes"
    "errors"
    "github.com/percybolmer/workflow/failure"
    "testing"
    "context"
)


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
func TestParseCsv_Initialize(t *testing.T) {
    proc := NewParseCsv()
    // Empty Init should fail
    proc.AddRequirement("test_prop")
    err := proc.Initialize()
    if err == nil {
        t.Fatal("Should have failed to initialize without proper Properties set")
    }
    proc.SetProperty("test_prop", true)
    err = proc.Initialize()
    if err != nil {
        t.Fatalf("Should have passed initialize now that all properties are there: %s", err.Error())
    }

}

func TestParseCsv_StopStart(t *testing.T){
    proc := NewParseCsv()


    if proc.IsRunning(){
        t.Fatal("proccessor should not be running after creation")
    }

    err := proc.Start(context.TODO())
    if err != nil {
        t.Fatal("processor should not have failed to startup")
    }
    err = proc.Start(context.TODO())
    if !errors.Is(err, failure.ErrAlreadyRunning) {
        t.Fatal("processor should have reported already running")
    }

    proc.Stop()
    err = proc.Start(context.TODO())
    if err != nil {
        t.Fatal("a restart should have been able to run")
    }
}