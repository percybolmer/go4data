// Package statistics is a subpackage to workflow
// it is used to store metadata about workflows and processors
package statistics

import "time"

// Statistics is used to store metadata about certain workflows
// it will also have a timer set that will wipe the data based on a given duration
type Statistics struct {
	// stats contains the metadata, for now its a interface container, but will that work? maybe to much reflection will be done
	// when trying to add stuff etc....
	stats map[string]interface{}
	//duration is how long metadata will be stored before being wiped
	duration time.Duration
}

// NewStatistics will initialize a statistics object adn return a pointer to it
// It will also trigger a goroutine that will Wipe data based on the duration set
func NewStatistics() *Statistics {
	return &Statistics{
		stats: make(map[string]interface{}),
	}
}
