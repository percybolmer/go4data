// Package filters is a Handler group that has Handlers that are related to filtering data
// This particular Handler is used to filter out CSV that contains certian values
package filters

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/percybolmer/workflow/handlers/payloads"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
	"github.com/percybolmer/workflow/register"
)

var (
	//ErrNotCSVInput is thrown when the input payload is of the wrong type
	ErrNotCSVInput error = errors.New("The input is not a CSV row, make sure you use CSVParser before")
)

// CsvFilter is used to filter out CSV that contains Values to search for
type CsvFilter struct {
	// Cfg is values needed to properly run the Handle func
	Cfg     *property.Configuration `json:"configs" yaml:"configs"`
	Name    string                  `json:"name" yaml:"handler_name"`
	filters map[string]*regexp.Regexp

	strictMode bool

	subscriptionless bool
	errChan          chan error
	metrics          metric.Provider
	metricPrefix     string
	// MetricPayloadOut is how many payloads the processor has outputted
	MetricPayloadOut string
	// MetricPayloadIn is how many payloads the processor has inputted
	MetricPayloadIn string
}

func init() {
	register.Register("CsvFilter", NewCsvFilterHandler())
}

// NewCsvFilterHandler generates a new CsvFilter Handler
func NewCsvFilterHandler() *CsvFilter {
	act := &CsvFilter{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:    "CsvFilter",
		filters: make(map[string]*regexp.Regexp),
		errChan: make(chan error, 1000),
	}
	act.Cfg.AddProperty("strict", "Setting strict to true will make the Handler only output payloads containing ALL filter values", false)
	act.Cfg.AddProperty("filters", "An Key->Value setting. Setting a filter here will check incominng payloads if they are a map, and if they are it will check if the key->Value setting exists in the payload", true)
	return act
}

// GetHandlerName is used to retrun a unqiue string name
func (a *CsvFilter) GetHandlerName() string {
	return a.Name
}

// Handle is used to filter out CSV values. If a value matches a filter it will continue forward
// If strict mode is set it will only output CSV rows containing all values
func (a *CsvFilter) Handle(ctx context.Context, input payload.Payload, topics ...string) error {
	a.metrics.IncrementMetric(a.MetricPayloadIn, 1)
	m, err := a.isPayloadCSV(input)
	if err != nil {
		return fmt.Errorf("%w:%v", ErrNotCSVInput, err)
	}
	if a.isMatch(m) {

		a.metrics.IncrementMetric(a.MetricPayloadOut, 1)
		errs := pubsub.PublishTopics(topics, input)
		if errs != nil {
			for _, err := range errs {
				a.errChan <- err
			}
		}
		return nil
	}

	return nil

}

// isMatch is used to control if current filters matches input
func (a *CsvFilter) isMatch(row *payloads.CsvRow) bool {
	foundItems := 0
	totalItems := len(a.filters)
	header := strings.Split(row.Header, row.Delimiter)
	values := strings.Split(row.Payload, row.Delimiter)
	if len(header) != len(values) {
		return false
	}
	for key, filter := range a.filters {
		for i, head := range header {
			if head == key {
				if filter.MatchString(values[i]) {
					foundItems++
				}
			}
		}
	}

	if a.strictMode {
		if foundItems == totalItems {
			return true
		}
		return false
	}
	if foundItems > 0 {
		return true
	}
	return false
}

// isPayloadMap makes sure that the input payload is of the correct type
func (a *CsvFilter) isPayloadCSV(p payload.Payload) (*payloads.CsvRow, error) {
	// Cast payload to CSVRow
	conv, ok := p.(*payloads.CsvRow)
	if ok {
		return conv, nil
	}
	return nil, ErrNotCSVInput
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *CsvFilter) ValidateConfiguration() (bool, []string) {
	// Check if Cfgs are there as needed
	strictProp := a.Cfg.GetProperty("strict")
	filterProp := a.Cfg.GetProperty("filters")
	missing := make([]string, 0)

	// Check if regexp mode should be enabled
	if filterProp == nil || filterProp.Value == nil {
		missing = append(missing, "filters")
		return false, missing
	}

	filterMap, err := filterProp.StringMap()

	if err != nil {
		missing = append(missing, err.Error())
		return false, missing
	}
	for key, value := range filterMap {
		reg, err := regexp.Compile(value)
		if err != nil {
			missing = append(missing, err.Error())
		} else {
			a.filters[key] = reg
		}
	}
	if len(missing) != 0 {
		return false, missing
	}

	// Check if strict Mode should be enabled
	if strictProp != nil && strictProp.Value != nil {
		strictMode, err := strictProp.Bool()
		if err != nil {
			missing = append(missing, err.Error())
			return false, missing
		}
		a.strictMode = strictMode
	}

	return true, nil
}

// GetConfiguration will return the CFG for the Handler
func (a *CsvFilter) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return true/false if the Handler is genereating payloads itself
func (a *CsvFilter) Subscriptionless() bool {
	return a.subscriptionless
}

// GetErrorChannel will return a channel that the Handler can output eventual errors onto
func (a *CsvFilter) GetErrorChannel() chan error {
	return a.errChan
}

// SetMetricProvider is used to change what metrics provider is used by the handler
func (a *CsvFilter) SetMetricProvider(p metric.Provider, prefix string) error {
	a.metrics = p
	a.metricPrefix = prefix

	a.MetricPayloadIn = fmt.Sprintf("%s_payloads_in", prefix)
	a.MetricPayloadOut = fmt.Sprintf("%s_payloads_out", prefix)
	err := a.metrics.AddMetric(&metric.Metric{
		Name:        a.MetricPayloadOut,
		Description: "keeps track of how many payloads the handler has outputted",
	})
	if err != nil {
		return err
	}
	err = a.metrics.AddMetric(&metric.Metric{
		Name:        a.MetricPayloadIn,
		Description: "keeps track of how many payloads the handler has ingested",
	})
	return err
}
