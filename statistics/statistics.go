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
)

// Statistics is used to store metadata about certain workflows
// it will also have a timer set that will wipe the data based on a given duration
type Statistics struct {
	// stats contains the metadata, for now its a map of ints, Since usually Stats will be integers
	// such as, processed Bytes or X number of flows.
	Stats map[string]int `json:"stats"`
	//duration is how long metadata will be stored before being wiped
	duration time.Duration
	mux      sync.Mutex
}

// NewStatistics will initialize a statistics object adn return a pointer to it
// It will also trigger a goroutine that will Wipe data based on the duration set
func NewStatistics() *Statistics {
	return &Statistics{
		Stats: make(map[string]int),
	}
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
}
