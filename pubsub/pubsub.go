package pubsub

import (
	"github.com/percybolmer/go4data/payload"
)

// Engine is a interface that declares what methods a pub/sub engine needs in Go4Data
type Engine interface {
	Publish(key string, payloads ...payload.Payload) []PublishingError
	PublishTopics(topics []string, payloads ...payload.Payload) []PublishingError
	Subscribe(key string, pid uint, queueSize int) (*Pipe, error)
	Cancel()
}

// DialOptions are used to configure with variable amount of Options
type DialOptions func(Engine) (Engine, error)

// engine is the currently selected Engine to use for Pub/Sub.
var engine Engine

func init() {
	// Set DefaultEngine as a Default on INIT to avoid API calls from crashing
	NewEngine(WithDefaultEngine(2))
}

// NewEngine is used to startup a new Engine based on the Options used
func NewEngine(opts ...DialOptions) (Engine, error) {
	var e Engine
	// ForEach Option passed in run the configuration
	for _, opt := range opts {
		new, err := opt(e)
		if err != nil {
			return nil, err
		}
		e = new

	}
	return e, nil
}

// Subscribe will use the currently selected Pub/Sub engine
// And subscribe to a topic
func Subscribe(key string, pid uint, queueSize int) (*Pipe, error) {
	return engine.Subscribe(key, pid, queueSize)
}

// Publish is used to publish payloads onto the currently selected Pub/Sub engine
func Publish(key string, payloads ...payload.Payload) []PublishingError {
	return engine.Publish(key, payloads...)
}

// PublishTopics will push payloads onto many Topics
func PublishTopics(topics []string, payloads ...payload.Payload) []PublishingError {
	return engine.PublishTopics(topics, payloads...)
}
