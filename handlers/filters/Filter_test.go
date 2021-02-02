package filters

import (
	"errors"
	"regexp"
	"strings"
	"testing"

	"github.com/percybolmer/go4data/metric"
	"github.com/percybolmer/go4data/payload"
	"github.com/percybolmer/go4data/property"
	"github.com/percybolmer/go4data/pubsub"
)

type FilterPayload struct {
	Username string
	Email    string
}

type NotFilterPayload struct {
	payload.Payload
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

func TestIsFilterable(t *testing.T) {
	fh := NewFilterHandler()

	handler := fh.(*FilterHandler)
	notfilt := NotFilterPayload{}
	filterable, err := handler.isPayloadFilterable(notfilt)

	if !errors.Is(err, ErrNotFilterablePayload) {
		t.Fatal("Should detect unfilterable payload")
	}
	if filterable != nil {
		t.Fatal("Filterable should be nil")
	}

	basefilt := payload.NewBasePayload([]byte("test"), "test", nil)
	filterable, err = handler.isPayloadFilterable(basefilt)

	if err != nil {
		t.Fatal(err)
	}
	if filterable == nil {
		t.Fatal("Should not be nil")
	}

}

func TestEmailRegexp(t *testing.T) {
	email := regexp.MustCompile("^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

	if !email.MatchString("percy@hotmail.com") {
		t.Fatal("Should be valid email")
	}

}

func TestFilterHandle(t *testing.T) {
	fh := NewFilterHandler()
	fh.SetMetricProvider(metric.NewPrometheusProvider(), "filtertestHandler")

	filters := make(map[string][]string, 0)
	filters["userinformation"] = append(filters["userinformation"], "username:^[a-zA-Z0-9]{0,20}")
	cfg := fh.GetConfiguration()
	cfg.SetProperty("strict", []string{"userinformation"})
	cfg.SetProperty("filters", filters)

	valid, errs := fh.ValidateConfiguration()
	if !valid {
		t.Fatal(errs)
	}

	notfilt := NotFilterPayload{}
	err := fh.Handle(nil, notfilt, "non")
	if !errors.Is(err, ErrNotFilterablePayload) {
		t.Fatal(err)
	}
	pay := payload.NewBasePayload([]byte("perbol"), "filter", nil)
	err = fh.Handle(nil, pay, "publishme")
	if err != nil {
		t.Fatal(err)
	}

	// Now payload should have Metadata applied
	meta := pay.GetMetaData()
	if meta == nil {
		t.Fatal("Meta should not be nil")
	}
	filtergroups := meta.GetProperty("filter_group_hits")

	if filtergroups == nil {
		t.Fatal("Filtergroups should not be nil")
	}
	flow, err := pubsub.Subscribe("publishme", 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	pubsub.DrainTopicsBuffer()
	if len(flow.Flow) != 1 {
		t.Fatal("topic should have found 1 payload")
	}
	//t.Log(filtergroups.MapWithInterfaceSlice())

}

func TestFilterIsMatch(t *testing.T) {
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

func TestFilterHandleDefaultHandlerStuff(t *testing.T) {
	fh := NewFilterHandler()
	if fh.GetHandlerName() != "Filter" {
		t.Fatal("Wrong name returned")
	}

	if fh.Subscriptionless() {
		t.Fatal("Should not be subscriptionless")
	}
	if fh.GetErrorChannel() == nil {
		t.Fatal("Should not return nil errorchannel")
	}

	cfg := fh.GetConfiguration()
	cfg.RemoveProperty("filters")
	cfg.RemoveProperty("filterDirectory")

	valid, err := fh.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid without two needed properties")
	}
	if len(err) != 0 {
		if err[0] != payload.ErrFilterOrDirectory.Error() {
			t.Fatal("Wrong error message when no filter or directory is set")
		}
	}
	fh = NewFilterHandler()
	cfg = fh.GetConfiguration()
	cfg.SetProperty("filterDirectory", "/no/such/folder")
	valid, err = fh.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid without a proper filterDir")
	}
	if len(err) != 0 {
		if !strings.Contains(err[0], "no such file or directory") {
			t.Fatal("Didnt get no such file or dir")
		}
	}

	// Filter prop
	cfg.SetProperty("filterDirectory", nil)
	cfg.SetProperty("filters", true)
	valid, err = fh.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid without a proper value")
	}
	if len(err) != 0 {
		if err[0] != property.ErrWrongPropertyType.Error() {
			t.Fatal("Got the wrong error type: ", err[0])
		}
	}
	filters := make(map[string][]string, 0)
	filters["test"] = append(filters["test"], "not a filter")
	cfg.SetProperty("filters", filters)
	valid, err = fh.ValidateConfiguration()
	if valid {
		t.Fatal("Bad filters should throw errors")
	}
	if len(err) != 0 {
		if !strings.Contains(err[0], "not a filter: the filter") {
			t.Fatal("Bad filter rows should trigger an error")
		}
	}
	newfilter := make([]string, 0)
	newfilter = append(newfilter, "first:imafilter")
	filters["test"] = newfilter
	cfg.SetProperty("filters", filters)
	valid, err = fh.ValidateConfiguration()
	if !valid {
		t.Fatal("Should have been valid now")
	}
	handler := fh.(*FilterHandler)
	if len(handler.filters) != 1 {
		t.Fatal("Failed to apply filters")
	}
	// strict prop
	newstrict := make([]string, 0)
	newstrict = append(newstrict, "test")

	cfg.SetProperty("strict", newstrict)
	valid, err = fh.ValidateConfiguration()
	if !valid {
		t.Fatal("Should be valid even with strict")
	}
	handler = fh.(*FilterHandler)

	if len(handler.strictgroups) != 1 {
		t.Fatal("wrong amount of filter group")
	}

	cfg.SetProperty("strict", "wrongtype")
	valid, err = fh.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid with a bad strict type")
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

	//t.Logf("%+v", h.filters)
}
