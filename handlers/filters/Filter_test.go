package filters

import (
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

func TestFilterHandle(t *testing.T) {
	// use a CSV payload and see if both Strict groups and Non Strict works
	fh := NewFilterHandler()
	fh.SetMetricProvider(metric.NewPrometheusProvider(), "filterhandler")
	// strictMode should be an Array of GroupNames instead, That way you could specify that THIS x Group has to match All
	Cfg := fh.GetConfiguration()
	Cfg.SetProperty("strict", []string{"userinformation"})
	Cfg.SetProperty("filterDirectory", "testing")

	valid, _ := fh.ValidateConfiguration()
	if !valid {
		t.Fatal("Failed to init test FilterHandle")
	}
	h := fh.(*FilterHandler)

	// Send 2 CSV Rows, one with userinformation email set, one without
	emailPayload := FilterPayload{
		Username: "percy",
		Email:    "percy@hotmail.com",
	}
	noEmailPayload := FilterPayload{
		Username: "Bengt",
		Email:    "",
	}

	isEmailMatch := isMatch(&emailPayload, nil, h.filters, h.strictgroups)
	isNoEmailMatch := isMatch(&noEmailPayload, nil, h.filters, h.strictgroups)

	if !isEmailMatch {
		t.Fatal("IsEmailMatch is not true, should be true")
	} else if isNoEmailMatch {
		t.Fatal("IsNoEmailMatch is not false, should be false since strict mode applies")
	}

	// Test for MetaData so that its added correctly, also test so metadata isnt overwritten
	metacontainer := property.NewConfiguration()
	metacontainer.AddProperty("filter_group_hits", "this property contains all the filter groups that has hit, also the certain filters that hit", false)

	isEmailMatch = isMatch(&emailPayload, metacontainer, h.filters, h.strictgroups)
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
	findMeMatch := isMatch(&findMePayload, metacontainer, h.filters, h.strictgroups)
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
	Cfg := fh.GetConfiguration()
	Cfg.SetProperty("filterDirectory", "testing")
	Cfg.SetProperty("filters", filterMap)
	Cfg.SetProperty("strict", []string{"userinformation"})

	h := fh.(*FilterHandler)
	valid, errs := fh.ValidateConfiguration()
	if errs != nil {
		t.Fatal(errs[0])
	}

	if valid {
		if len(h.filters) != 3 {
			t.Fatal("Wrong length type for filter group")
		}
	}

	t.Logf("%+v", h.filters)
}
