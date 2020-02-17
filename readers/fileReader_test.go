package readers

import (
	"errors"
	"os"
	"testing"
)

func TestWriteFile(t *testing.T) {
	type testCase struct {
		TestName      string
		ExpectedError error
		File          string
		AppendTo      bool
		RemoveAfter   bool
	}

	testCases := []testCase{
		{"BadPath", os.ErrNotExist, "testfiles/dirNotExists/newfile", false, false},
		{"BadPathAppend", os.ErrNotExist, "testfiles/dirNotExists/newfile", true, false},
		{"NoPerm", os.ErrPermission, "testfiles/no_permission.txt", true, false},
	}

	for _, tc := range testCases {
		fr := FileReader{
			Path:            tc.File,
			RemoveAfterRead: tc.RemoveAfter,
			AppendTo:        tc.AppendTo,
		}
		err := fr.WriteFile(tc.File, []byte(`test`))
		if !errors.Is(err, tc.ExpectedError) {
			t.Fatalf("%s: %v", tc.TestName, err)
		}
	}
}

func TestReadFile(t *testing.T) {
	type testCase struct {
		TestName        string
		ExpectedError   error
		File            string
		RemoveAfterRead bool
		CreateFileFirst bool
	}

	testCases := []testCase{
		{"BadPath", os.ErrNotExist, "testfiles/dirNotExists/newfile", false, false},
		{"NoPerm", os.ErrPermission, "testfiles/no_permission.txt", false, false},
		{"RemoveAfter", nil, "testfiles/this_should_be_removed.txt", true, true},
	}

	for _, tc := range testCases {
		fr := FileReader{
			Path:            tc.File,
			RemoveAfterRead: tc.RemoveAfterRead,
		}
		if tc.CreateFileFirst {
			os.Create(tc.File)
		}
		_, err := fr.Read(tc.File)
		if !errors.Is(err, tc.ExpectedError) {
			t.Fatalf("%s: %v", tc.TestName, err)
		}
	}
}
