package pubsub

import "github.com/perbol/workflow/payload"

// Pipe is PUB/SUB output/input Struct used for publishing or Subscribing to data flows
type Pipe struct {
	Pid   uint   `json:"pid" yaml:"pid"`
	Topic string `json:"topic" yaml:"topic"`
	Flow  chan payload.Payload
}

// NewPipe creates a new data pipe
func NewPipe(topic string, pid uint, queueSize int) *Pipe {
	return &Pipe{
		Pid:   pid,
		Topic: topic,
		Flow:  make(chan payload.Payload, queueSize),
	}
}
