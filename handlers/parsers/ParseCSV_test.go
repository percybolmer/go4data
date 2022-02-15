package parsers

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/percybolmer/go4data/metric"
	"github.com/percybolmer/go4data/payload"
	"github.com/percybolmer/go4data/property"
)

func TestParseCSVHandle(t *testing.T) {
	badCsv := []string{"this is not csv"}
	concattedBadHeaders := []string{"this,is, start", "\n", "of, header", "\n", "this, is, the,value"}
	concattedHeaders := []string{"this, start", "\n", "of, header", "\n", "this, is, the,value"}
	skipRow := []string{"rubbish stuff to skip", "\n", "this,is,header", "\n", "value,is,here"}
	goodCsv := []string{"this,is,header", "\n", "value,is,here"}
	customDelim := []string{"this|is|header", "\n", "value|is|here"}
	type testCase struct {
		Name              string
		Data              []string
		Delimiter         string
		HeaderLength      int
		SkipRows          int
		ExpectedError     error
		ExpectedRowLength int
	}
	testcases := []testCase{
		{"NotCsv", badCsv, "", 1, 0, ErrNotCsv, 0},
		{"BadConcattenatedHeader", concattedBadHeaders, "", 2, 0, ErrHeaderMismatch, 0},
		{"ConcattenatedHeader", concattedHeaders, "", 2, 0, nil, 1},
		{"SkipRow", skipRow, "", 1, 1, nil, 1},
		{"GoodCSV", goodCsv, "", 1, 0, nil, 1},
		{"CustomDelimiter", customDelim, "|", 1, 0, nil, 1},
	}

	for i, tc := range testcases {
		rh := NewParseCSVHandler()
		r := rh.(*ParseCSV)
		r.SetMetricProvider(metric.NewPrometheusProvider(), fmt.Sprintf("%s_%d", tc.Name, i))
		if tc.Delimiter != "" {
			r.Cfg.SetProperty("delimiter", tc.Delimiter)
		}
		r.Cfg.SetProperty("headerlength", tc.HeaderLength)

		r.Cfg.SetProperty("skiprows", tc.SkipRows)

		valid, missing := r.ValidateConfiguration()
		if !valid {
			t.Fatalf("%s: %+v", tc.Name, missing)
		}
		var d bytes.Buffer
		for _, s := range tc.Data {
			d.WriteString(s)
		}

		err := r.Handle(context.Background(), &payload.BasePayload{
			Payload: d.Bytes(),
		}, "test")

		if !errors.Is(err, tc.ExpectedError) {
			t.Fatalf("%s: %s", tc.Name, err)
		}
		invalue := r.metrics.GetMetric(r.MetricPayloadOut).Value
		if int(invalue) != tc.ExpectedRowLength {
			t.Fatalf("%s: Wrong length on result: %f", tc.Name, invalue)
		}

	}
}

func TestParseCSVValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: true, Cfgs: map[string]interface{}{"skiprows": "test"}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: true, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
	}

	for _, tc := range testCases {
		rfg := NewParseCSVHandler()

		for name, prop := range tc.Cfgs {
			err := rfg.GetConfiguration().SetProperty(name, prop)
			if !errors.Is(err, tc.ExpectedErr) {
				if err != nil && tc.ExpectedErr != nil {
					t.Fatalf("Expected: %s, but found: %s", tc.ExpectedErr, err.Error())
				}

			}
		}

		valid, _ := rfg.ValidateConfiguration()
		if !tc.IsValid && valid {
			t.Fatal("Missmatch between Valid and tc.IsValid")
		}
	}
}
