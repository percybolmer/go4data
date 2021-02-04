package pubsub

import "github.com/percybolmer/go4data/payload"

// PublishingError is a custom error that is used when reporting back errors when trying to publish
// The reason for it is because we dont want a single Pipe to block all other pipes
type PublishingError struct {
	Err error
	// Pid is the processor ID
	Pid uint
	// Tid is the topic ID
	Tid     uint
	Payload payload.Payload
}

// Error is used to be part of error interface
func (pe PublishingError) Error() string {
	return pe.Err.Error()
}
