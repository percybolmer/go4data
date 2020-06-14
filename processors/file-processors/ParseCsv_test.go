package fileprocessors

import (
    "bytes"
    "errors"
    "github.com/percybolmer/workflow/failure"
    "github.com/percybolmer/workflow/relationships"
    "testing"
    "context"
)


func TestParseCsv(t *testing.T) {

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
        r := NewParseCsv()
        r.SetProperty("headerlength", tc.Headerlength)
        r.SetProperty("skiprows", tc.SkipRows)
        if tc.Delimiter != "" {
            r.SetProperty("delimiter", tc.Delimiter)
        }
        err := r.Initialize()
        if err != nil {
            t.Fatal("Should not have failed initailizing any tests, ", err)
        }

        var d bytes.Buffer
        for _, s := range tc.Data {
            d.WriteString(s)
        }

        results, err := r.Parse(d.Bytes())
        if !errors.Is(err, tc.ExpectedError) {
            t.Fatalf("%s:%v", tc.Name, err)
        }

        if results != nil {
            if len(results) != tc.ExpectedRecordLength {
                t.Errorf("%s: Wrong length on the entreies result: %d", tc.Name, len(results))
            } else {
                for _, res := range results {
                    t.Logf("%s: %+v", tc.Name, res)
                }
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
    proc.SetIngress(make(relationships.PayloadChannel,0))
    err := proc.Start(context.TODO())
    if err != nil {
        t.Fatal("processor should not have failed to startup: ", err)
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