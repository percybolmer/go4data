// Package statistics is a subpackage to workflow
// it is used to store metadata about workflows and processors
// Statistics package is used to export data to a prometheus scraper
package statistics

import (
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	//ErrNoSuchStat will be returned when no stat with a given value has yet been set
	ErrNoSuchStat error = errors.New("There is no statistic named what you asked")

	// DefaultStatDuration is a time in seconds that it will take before wiping stats from processors
	// TODO this hsould be configurable for the Flows in configs
	DefaultStatDuration time.Duration = 3600 * time.Second
)

const (
	_ = iota
	// CounterType represent a Prometheus Counter
	CounterType
	// GaugeType is a prometheus gauge
	GaugeType
	// HistogramType is NOT FINSIHED
	HistogramType
	// SummaryType is not finished
	SummaryType
)

// Statistics is used to store metadata about certain workflows
// it will also have a timer set that will wipe the data based on a given duration
type Statistics struct {
	// Stats contains the metadata, its map with the Stat name as key and a stat as value
	Stats map[string]*Stat `json:"stats"`
	// Since is the timestamp from when the stats are started to gather
	Since string `json:"since"`
	// LastUpdated is when the last stat update was inserted
	LastUpdated string `json:"lastupdated"`
	// Duration is how long metadata will be stored before being wiped
	Duration     time.Duration `json:"duration"`
	URL          string        `json:"url"`
	Port         int           `json:"port"`
	PromExport   bool          `json:"prometheusexport"`
	promRegistry *prometheus.Registry
	closed       chan bool
	mux          sync.RWMutex
}

// NewStatistics will initialize a statistics object adn return a pointer to it
// It will also trigger a goroutine that will Wipe data based on the duration set
// If prometheusexport is set to true it will generate a prometheus metric
func NewStatistics(t time.Duration, prometheusexport bool) *Statistics {
	if t == 0 {
		t = DefaultStatDuration
	}
	s := &Statistics{
		Stats:      make(map[string]*Stat),
		Duration:   t,
		closed:     make(chan bool),
		PromExport: prometheusexport,
	}
	s.Start()
	return s
}

// Close will make the statsistics goroutine close
func (s *Statistics) Close() {
	s.Since = ""
	s.LastUpdated = ""
	s.closed <- true
}

func getDateTime() string {
	dt := time.Now()
	return dt.Format("2006-02-01 15:04:05")

}

// Start will start a goroutine that will wipe data between duration interval
func (s *Statistics) Start() {
	s.Since = getDateTime()
	go func() {
		ticker := time.NewTicker(s.Duration)
		for {
			select {
			case <-ticker.C:
				s.ResetStats()
			case <-s.closed:
				return
			}

		}

	}()
}

// ExportToPrometheus will enable all stats that are inside the statistics to be exported to an Metric report to be scraped by any prometheus
func (s *Statistics) ExportToPrometheus(url string, port int) {
	s.URL = url
	s.Port = port
	s.PromExport = true
	s.promRegistry = prometheus.NewRegistry()
	server := http.NewServeMux()
	server.Handle(url, promhttp.HandlerFor(s.promRegistry, promhttp.HandlerOpts{}))
	// start an http server using the mux server
	go http.ListenAndServe(fmt.Sprintf(":%d", port), server)

}

// ResetStats will remove all stats in memory and replace with a fresh map
// It will loop through all stats and reset any stat that should be reset, all gouge types, does not reset Counter types
func (s *Statistics) ResetStats() {
	defer s.mux.Unlock()
	s.mux.Lock()

	// If Prometheus is active, Deregister all
	if s.PromExport {
		for _, stat := range s.Stats {
			if stat.counter != nil {
				s.promRegistry.Unregister(stat.counter)
			} else if stat.gauge != nil {
				s.promRegistry.Unregister(stat.gauge)
			}
		}
	}
	s.Stats = make(map[string]*Stat)
	s.Since = getDateTime()
	s.LastUpdated = getDateTime()
}

// GetStat is used to lookup a statistic value
// Can return an Error if no such value is found
func (s *Statistics) GetStat(name string) (*Stat, error) {
	if _, ok := s.Stats[name]; !ok {
		return nil, ErrNoSuchStat
	}
	return s.Stats[name], nil

}

// AddStat will create a new stat and add the value to it,
// Or append the value to the old stat
// t is the Prometheus type
// description should be the Prometheus Help line
func (s *Statistics) AddStat(name, description string, t int, value float64) {
	if _, ok := s.Stats[name]; !ok {
		s.mux.Lock()
		stat := &Stat{
			Value:       value,
			Type:        t,
			Description: description,
			Name:        name,
		}
		if s.PromExport {
			stat.exportPrometheusStat()
			var err error
			switch stat.Type {
			case CounterType:
				err = s.promRegistry.Register(stat.counter)
				// Check if error iis An DUplicate or an actual error fix this to avoid code reoeat for each type
				if err != nil {
					if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
						// A counter for that metric has been registered before.
						// Use the old counter from now on.
						stat.counter = are.ExistingCollector.(prometheus.Counter)
					}
				}
			case GaugeType:
				err = s.promRegistry.Register(stat.gauge)
				if err != nil {
					if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
						// A counter for that metric has been registered before.
						// Use the old counter from now on.
						stat.gauge = are.ExistingCollector.(prometheus.Gauge)
					}
				}
			}

		}
		s.Stats[name] = stat
		s.mux.Unlock()
	} else {
		oldStat := s.Stats[name]
		oldStat.AppendValue(value)
	}
	s.LastUpdated = getDateTime()
}
