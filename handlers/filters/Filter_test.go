package filters

import (
	"errors"
	"regexp"
	"testing"

	"github.com/percybolmer/workflow/metric"
)

type FilterPayload struct {
	Username string
	Email    string
}

func (fp *FilterPayload) ApplyFilter(f *Filter) bool {
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

	f, err := parseFilterLine(line)
	if err != nil {
		t.Fatal(err)
	}

	if !f.Regexp.MatchString("percy@hotmail.com") {
		t.Fatal("Should be valid email")
	}

	badLine := "blablipopp"
	_, err = parseFilterLine(badLine)
	if !errors.Is(err, ErrBadFilterFormat) {
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

	isEmailMatch := fh.isMatch(&emailPayload)
	isNoEmailMatch := fh.isMatch(&noEmailPayload)

	if !isEmailMatch {
		t.Fatal("IsEmailMatch is not true, should be true")
	} else if isNoEmailMatch {
		t.Fatal("IsNoEmailMatch is not false, should be false since strict mode applies")
	}
}

func TestFilterValidateConfiguration(t *testing.T) {
	// add All 3 Properties and try Validating and check that filters load corr

	fh := NewFilterHandler()
	fh.SetMetricProvider(metric.NewPrometheusProvider(), "filterhandler")

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
		if len(fh.filters) != 2 {
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
		{Name: "EmptyPath", Path: "", ExpectedErr: ErrEmptyFilterDirectory},
		{Name: "RealPath", Path: "testing", ExpectedErr: nil, GroupLength: 1, GroupName: "userinformation", Filters: 1},
	}

	for _, tc := range testCases {
		groups, err := loadFilterDirectory(tc.Path)

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
