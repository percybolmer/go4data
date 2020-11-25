// Package filters contains all there is to the Filterable interface.
// This is a interface that Payload types can inccorporate so that they can pass through this filter function
package filters

import (
	"context"
	"errors"
	"fmt"

	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/payload"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
	"github.com/percybolmer/workflow/register"
)

var (
	//ErrNotFilterablePayload is thrown when the input payload does not fullfill filterable
	ErrNotFilterablePayload error = errors.New("The input payload is not filterable")
)

// FilterHandler is used to filter out payloads that contains the wanted values
type FilterHandler struct {
	// Cfg is values needed to properly run the Handle func
	Cfg  *property.Configuration `json:"configs" yaml:"configs"`
	Name string                  `json:"name" yaml:"handler_name"`

	filters      map[string][]*payload.Filter
	strictgroups []string

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
	register.Register("Filter", NewFilterHandler())
}

// NewFilterHandler generates a new Filter Handler
func NewFilterHandler() *FilterHandler {
	act := &FilterHandler{
		Cfg: &property.Configuration{
			Properties: make([]*property.Property, 0),
		},
		Name:    "Filter",
		errChan: make(chan error, 1000),
		filters: make(map[string][]*payload.Filter, 0),
	}
	act.Cfg.AddProperty("strict", "Strict is a array of groupnames that will apply StrictMode, with strictmode all Filters in that group has to match", false)
	act.Cfg.AddProperty("filters", "An Key:value setting, will check if incomming Payloads are filterable and if the Value exists in the keyslot", false)
	act.Cfg.AddProperty("filterDirectory", "A directory that contains filter lists, the file name will be used as the filtergroup name. Filter lists should contain key:value filters separated by newline", false)
	return act
}

// GetHandlerName is used to retrun a unqiue string name
func (a *FilterHandler) GetHandlerName() string {
	return a.Name
}

// Handle is used to check if payload is of Filterable type, then apply Filter to it
func (a *FilterHandler) Handle(ctx context.Context, input payload.Payload, topics ...string) error {
	a.metrics.IncrementMetric(a.MetricPayloadIn, 1)
	m, err := a.isPayloadFilterable(input)
	if err != nil {
		return fmt.Errorf("%w:%v", ErrNotFilterablePayload, err)
	}
	metacontainer := input.GetMetaData()
	if metacontainer != nil {
		prop := metacontainer.GetProperty("filter_group_hits")
		if prop == nil {
			metacontainer.AddProperty("filter_group_hits", "this property contains all the filter groups that has hit, also the certain filters that hit", false)
		}
	}
	if a.isMatch(m, metacontainer) {
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
func (a *FilterHandler) isMatch(input payload.Filterable, meta *property.Configuration) bool {
	// Itterate all Filter groups
	hits := make(map[string][]*payload.Filter, 0)
	if meta != nil {
		hitgroups := meta.GetProperty("filter_group_hits")
		if hitgroups != nil {
			// See if its set in the old payload, we dont want to overwrite
			if hitgroups.Value != nil {
				// Reflect it back into map[string][]Filters
				if oldhits, ok := hitgroups.Value.(map[string][]*payload.Filter); ok {
					hits = oldhits
				}
			}
		}
	}
	for group, filters := range a.filters {
		totalHits := 0
		filterHits := make([]*payload.Filter, 0)
		// See if its a strict mode Group
		var strictMode bool
		for _, strictGroup := range a.strictgroups {
			if strictGroup == group {
				strictMode = true
			}
		}

		for _, filter := range filters {
			hit := input.ApplyFilter(filter)
			if hit {
				// Add metadata to the payload about what Groups and Keywords that hit
				filterHits = append(filterHits, filter)
				totalHits++
			}

		}
		// See if filter group Matched all if its part of strict Groups
		if strictMode {
			if totalHits == len(filters) {
				hits[group] = append(hits[group], filterHits...)
			}
			continue
		}
		if totalHits > 0 {
			hits[group] = append(hits[group], filterHits...)
		}

	}
	if len(hits) != 0 {
		if meta != nil {
			meta.SetProperty("filter_group_hits", hits)
		}

		return true
	}
	return false

}

// isPayloadMap makes sure that the input payload is of the correct type
func (a *FilterHandler) isPayloadFilterable(p payload.Payload) (payload.Filterable, error) {
	// Cast payload to Filterable if possible
	var i interface{} = p
	conv, ok := i.(payload.Filterable)
	if ok {
		return conv, nil
	}
	return nil, ErrNotFilterablePayload
}

// ValidateConfiguration is used to see that all needed configurations are assigned before starting
func (a *FilterHandler) ValidateConfiguration() (bool, []string) {
	// Check if Cfgs are there as needed
	strictProp := a.Cfg.GetProperty("strict")
	filterProp := a.Cfg.GetProperty("filters")
	directoryProp := a.Cfg.GetProperty("filterDirectory")
	var missing []string
	if (filterProp == nil && filterProp.Value == nil) && (directoryProp == nil && directoryProp.Value == nil) {
		missing = append(missing, payload.ErrFilterOrDirectory.Error())
		return false, missing
	}

	if directoryProp != nil && directoryProp.Value != nil {
		// Load Directory of Filters
		filters, err := payload.LoadFilterDirectory(directoryProp.String())
		if err != nil {
			return false, []string{err.Error()}
		}
		a.filters = filters
	}
	if filterProp != nil && filterProp.Value != nil {
		filterMap, err := filterProp.MapWithSlice()
		if err != nil {
			return false, []string{err.Error()}
		}
		// FilterMap should be GroupName: "key:value"
		for groupName, values := range filterMap {
			for _, value := range values {
				filter, err := payload.ParseFilterLine(value)
				if err != nil {
					return false, []string{err.Error()}
				}
				filter.GroupName = groupName
				a.filters[groupName] = append(a.filters[groupName], filter)
			}
		}
	}
	// Check if strict Mode should be enabled
	if strictProp != nil && strictProp.Value != nil {
		strictMode, err := strictProp.StringSplice()
		if err != nil {
			missing = append(missing, err.Error())
			return false, missing
		}
		a.strictgroups = strictMode
	}

	return true, nil
}

// GetConfiguration will return the CFG for the Handler
func (a *FilterHandler) GetConfiguration() *property.Configuration {
	return a.Cfg
}

// Subscriptionless will return true/false if the Handler is genereating payloads itself
func (a *FilterHandler) Subscriptionless() bool {
	return a.subscriptionless
}

// GetErrorChannel will return a channel that the Handler can output eventual errors onto
func (a *FilterHandler) GetErrorChannel() chan error {
	return a.errChan
}

// SetMetricProvider is used to change what metrics provider is used by the handler
func (a *FilterHandler) SetMetricProvider(p metric.Provider, prefix string) error {
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
