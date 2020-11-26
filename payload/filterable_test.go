package payload

import (
	"errors"
	"testing"
)

func TestParseFilterLine(t *testing.T) {
	line := "userinformation:^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"

	f, err := ParseFilterLine(line)
	if err != nil {
		t.Fatal(err)
	}

	if !f.Regexp.MatchString("percy@hotmail.com") {
		t.Fatal("Should be valid email")
	}

	badLine := "blablipopp"
	_, err = ParseFilterLine(badLine)
	if !errors.Is(err, ErrBadFilterFormat) {
		t.Fatal("Should have triggerd abad filter format")
	}
}

func TestLoadFilterDirectory(t *testing.T) {
	type testcase struct {
		Name        string
		Path        string
		ExpectedErr error
		GroupLength int
		GroupName   string
		Filters     int
	}

	testCases := []testcase{
		{Name: "EmptyPath", Path: "", ExpectedErr: ErrEmptyFilterDirectory},
		{Name: "RealPath", Path: "../handlers/filters/testing", ExpectedErr: nil, GroupLength: 2, GroupName: "userinformation", Filters: 1},
	}

	for _, tc := range testCases {
		groups, err := LoadFilterDirectory(tc.Path)

		if !errors.Is(err, tc.ExpectedErr) {
			t.Fatalf("%s: %s", tc.Name, err.Error())
		}

		if groups != nil {
			if tc.GroupLength != len(groups) {
				t.Fatal("Wrong group length")
			}

			if tc.GroupName != "" {
				if groups[tc.GroupName] != nil {
					if len(groups[tc.GroupName]) != tc.Filters {
						t.Fatal("Wrong amount of filters found")
					}
				}
			}
		}
	}
}
