package filters

import (
	"errors"
	"regexp"
	"testing"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
)

type FilterPayload struct {
	Username string
	Email    string
}

func (fp *FilterPayload) ApplyFilter(f *payload.Filter) bool {
	switch f.Key {
	case "email":
		return f.Regexp.MatchString(fp.Email)
	case "username":
		return f.Regexp.MatchString(fp.Username)
	default:
		return false
	}
}

func TestEmailRegexp(t *testing.T) {
	email := regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

	if !email.MatchString("percy@hotmail.com") {
		t.Fatal("Should be valid email")
	}

}
func TestParseFilterLine(t *testing.T) {
	line := "userinformation:^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"

	f, err := payload.ParseFilterLine(line)
	if err != nil {
		t.Fatal(err)
	}

	if !f.Regexp.MatchString("percy@hotmail.com") {
		t.Fatal("Should be valid email")
	}

	badLine := "blablipopp"
	_, err = payload.ParseFilterLine(badLine)
	if !errors.Is(err, payload.ErrBadFilterFormat) {
		t.Fatal("Should have triggerd abad filter format")
	}
}
func TestFilterHandle(t *testing.T) {
	// use a CSV payload and see if both Strict groups and Non Strict works
	fh := NewFilterHandler()
	fh.SetMetricProvider(metric.NewPrometheusProvider(), "filterhandler")
	// strictMode should be an Array of GroupNames instead, That way you could specify that THIS x Group has to match All

	fh.Cfg.SetProperty("strict", []string{"userinformation"})
	fh.Cfg.SetProperty("filterDirectory", "testing")

	valid, _ := fh.ValidateConfiguration()
	if !valid {
		t.Fatal("Failed to init test FilterHandle")
	}

	// Send 2 CSV Rows, one with userinformation email set, one without
	emailPayload := FilterPayload{
		Username: "percy",
		Email:    "percy@hotmail.com",
	}
	noEmailPayload := FilterPayload{
		Username: "Bengt",
		Email:    "",
	}

	isEmailMatch := fh.isMatch(&emailPayload, nil)
	isNoEmailMatch := fh.isMatch(&noEmailPayload, nil)

	if !isEmailMatch {
		t.Fatal("IsEmailMatch is not true, should be true")
	} else if isNoEmailMatch {
		t.Fatal("IsNoEmailMatch is not false, should be false since strict mode applies")
	}

	// Test for MetaData so that its added correctly, also test so metadata isnt overwritten
	metacontainer := property.NewConfiguration()
	metacontainer.AddProperty("filter_group_hits", "this property contains all the filter groups that has hit, also the certain filters that hit", false)

	isEmailMatch = fh.isMatch(&emailPayload, metacontainer)
	if !isEmailMatch {
		t.Fatal("isEmailMatch should be true, even with metacontainer")
	}

	filterhits := metacontainer.GetProperty("filter_group_hits").Value

	if hits, ok := filterhits.(map[string][]*payload.Filter); ok {
		if len(hits) != 1 {
			t.Fatal("Wrong length of metadata")
		}
	}

	findMePayload := FilterPayload{
		Username: "FindMe",
		Email:    "test@testerson.com",
	}

	// Lets reuse the metacontainer, this is not the usecase in real examples, each payload will have its own, but we want to spoof this
	findMeMatch := fh.isMatch(&findMePayload, metacontainer)
	if !findMeMatch {
		t.Fatal("findMeMatch should be a match")
	}
	filterhits = metacontainer.GetProperty("filter_group_hits").Value

	if hits, ok := filterhits.(map[string][]*payload.Filter); ok {
		// We should now see 2 HitGroups, certainuser and userinformation
		// userinformation should also have 2 hits
		if len(hits) != 2 {
			t.Fatal("Wrong length of metadata")
		}
		if len(hits["userinformation"]) != 2 {
			t.Fatal("Wrong length of userinfromation from findme")
		}
	}

}

func TestFilterValidateConfiguration(t *testing.T) {
	// add All 3 Properties and try Validating and check that filters load corr
	fh := NewFilterHandler()
	fh.SetMetricProvider(metric.NewPrometheusProvider(), "filterhandlerValidate")

	filterMap := make(map[string][]string, 0)
	filterMap["userdata"] = []string{"username:^[a-zA-Z0-9]{0,20}"}
	fh.Cfg.SetProperty("filterDirectory", "testing")
	fh.Cfg.SetProperty("filters", filterMap)
	fh.Cfg.SetProperty("strict", []string{"userinformation"})

	valid, errs := fh.ValidateConfiguration()
	if errs != nil {
		t.Fatal(errs[0])
	}

	if valid {
		if len(fh.filters) != 3 {
			t.Fatal("Wrong length type for filter group")
		}
	}

	t.Logf("%+v", fh.filters)
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
		{Name: "EmptyPath", Path: "", ExpectedErr: payload.ErrEmptyFilterDirectory},
		{Name: "RealPath", Path: "testing", ExpectedErr: nil, GroupLength: 2, GroupName: "userinformation", Filters: 1},
	}

	for _, tc := range testCases {
		groups, err := payload.LoadFilterDirectory(tc.Path)

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
