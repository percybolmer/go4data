// Package statistics is a subpackage to workflow
// it is used to store metadata about workflows and processors
package statistics

import (
	"errors"
	"sync"
	"time"
)

var (
	//ErrNoSuchStat will be returned when no stat with a given value has yet been set
	ErrNoSuchStat error = errors.New("There is no statistic named what you asked")

	// DefaultStatDuration is a time in seconds that it will take before wiping stats from processors
	// TODO this hsould be configurable for the Flows in configs
	DefaultStatDuration time.Duration = 3600 * time.Second
)

// Statistics is used to store metadata about certain workflows
// it will also have a timer set that will wipe the data based on a given duration
type Statistics struct {
	// stats contains the metadata, for now its a map of ints, Since usually Stats will be integers
	// such as, processed Bytes or X number of flows.
	Stats map[string]int `json:"stats"`
	// Since is the timestamp from when the stats are started to gather
	Since string `json:"since"`
	// LastUpdated is when the last stat update was inserted
	LastUpdated string `json:"lastupdated"`
	// Duration is how long metadata will be stored before being wiped
	Duration time.Duration `json:"duration"`
	closed   chan bool
	mux      sync.Mutex
}

// NewStatistics will initialize a statistics object adn return a pointer to it
// It will also trigger a goroutine that will Wipe data based on the duration set
func NewStatistics(t time.Duration) *Statistics {
	if t == 0 {
		t = DefaultStatDuration
	}
	s := &Statistics{
		Stats:    make(map[string]int),
		Duration: t,
		closed:   make(chan bool),
	}
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

// ResetStats will remove all stats in memory and replace with a fresh map
func (s *Statistics) ResetStats() {
	defer s.mux.Unlock()
	s.mux.Lock()
	s.Stats = make(map[string]int)
	s.Since = getDateTime()
	s.LastUpdated = getDateTime()
}

// GetStat is used to lookup a statistic value
// Can return an Error if no such value is found
func (s *Statistics) GetStat(name string) (int, error) {
	if _, ok := s.Stats[name]; !ok {
		return -1, ErrNoSuchStat
	}
	return s.Stats[name], nil

}

// AddStat will create a new stat and add the value to it,
// Or append the value to the old stat
func (s *Statistics) AddStat(name string, value int) {
	defer s.mux.Unlock()
	s.mux.Lock()
	if _, ok := s.Stats[name]; !ok {
		s.Stats[name] = value
	} else {
		s.Stats[name] = s.Stats[name] + value
	}
	s.LastUpdated = getDateTime()
}
