package fileprocessors

import (
    "context"
    "errors"
    "github.com/percybolmer/workflow/failure"
    "github.com/percybolmer/workflow/payload"
    "os"
    "testing"
)

func TestWriteFile_Initialize(t *testing.T) {
    proc := NewWriteFile()
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

func TestWriteFile_Write(t *testing.T) {
    proc := NewWriteFile()

    type testcase struct {
        Test string
        Append bool
        Path string
        ExpectedErr error
    }
    // Create needed files for test
    os.Create("testfiles/writetothis.txt")
    testCases := []testcase{
        {"without_append_existingfile", false, "testfiles/writetothis.txt", ErrFileExists},
        {"existingfile_append", true, "testfiles/writetothis.txt", nil},
        //{"point_to_directory", true, "testfiles", nil},
        {"nonexistingfile_append", true, "testfiles/notexisting.txt", nil},
        {"nonexistingfile-no-append", false, "testfiles/he.txt", nil},


    }
    // Write to file with append that does exist -- should append
    // Write to file with append that does not exist -- should create
    for _, tc := range testCases{
        err := proc.Write(tc.Path, tc.Append, payload.BasePayload{
            Payload: []byte("hello_world"),
            Source:  "WriteFileTest",
        })

        if !errors.Is(err, tc.ExpectedErr) {
            t.Fatalf("Test: %s Expected: %v, bout got: %v", tc.Test, tc.ExpectedErr, err)
        }
    }
    // Cleanup after test
    os.Remove("testfiles/writetothis.txt")
    os.Remove("testfiles/he.txt")
    os.Remove("testfiles/notexisting.txt")
}

func TestWriteFile_StopStart(t *testing.T){
    proc := NewWriteFile()


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