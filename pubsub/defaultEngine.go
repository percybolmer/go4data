// Package pubsub contains defaultEngine is the default built-in Channel based engine
// used to pubsub
package pubsub

import (
	"errors"
	"sync"
	"time"

	"github.com/percybolmer/go4data/payload"
)

var (
	//ErrTopicAlreadyExists is thrown when running NewTopic on a topic that already exists
	ErrTopicAlreadyExists = errors.New("this topic does already exist, cannot create a duplicate topic")
	//ErrPidAlreadyRegistered is thrown when trying to publish/subscribe with a processor already publishing/subscribing on a certain topic
	ErrPidAlreadyRegistered = errors.New("the pid is already Registered, duplicate Pub/Subs not allowed")
	//ErrNoSuchTopic is a error that can be thrown when no topic is found
	ErrNoSuchTopic = errors.New("the topic key you search for does not exist")
	//ErrNoSuchPid is when no Pid in a topic is found
	ErrNoSuchPid = errors.New("no such pid was found on this topic")
	//ErrIsNotTopic is when something else than a topic has been loaded in a map
	ErrIsNotTopic = errors.New("the item stored in this key is not a topic")

	//ErrProcessorQueueIsFull is when a Publisher is trying to publish to a queue that is full
	ErrProcessorQueueIsFull = errors.New("cannot push new payload since queue is full")
	//ErrTopicBufferIsFull is when a Publisher is trying to publish to a Topic that has a full buffer
	ErrTopicBufferIsFull = errors.New("cannot push new payload since topic queue is full")

	//IDCounter is used to make sure no Topic are generated with a ID that already exists
	IDCounter uint = 1
)

// DefaultEngine is the default Pub/Sub engine that Go4Data uses
// It's a channnel based in-memory pubsub system.
type DefaultEngine struct {
	// Topics is a container for topics that has been created.
	// A topic is automatically created when a Processor registers as a Subscriber to it
	Topics sync.Map
}

// Topic is a topic that processors can publish or subscribe to
type Topic struct {
	// Key is a string value of the topic
	Key string
	// ID is a unique ID
	ID uint
	// Subscribers is a datapipe to all processors that has Subscribed
	Subscribers []*Pipe
	// Buffer is a data pipe containing our Buffer data. It will empty as soon as a subscriber registers
	Buffer *Pipe
	sync.Mutex
}

// newID is used to generate a new ID
func newID() uint {
	IDCounter++
	return IDCounter - 1
}

// EngineAsDefaultEngine will convert the engine to a DefaultEngine
// This is usaully just needed in tests
func EngineAsDefaultEngine() (*DefaultEngine, error) {
	conv, ok := engine.(*DefaultEngine)
	if ok {
		return conv, nil
	}
	return nil, errors.New("Failed to convert engine to defaultEngine")
}

// WithDefaultEngine is a DialOption that will make the DefaultEngine
// Drain the Buffer each X Second in the background
func WithDefaultEngine(seconds int) DialOptions {
	return func(e Engine) (Engine, error) {
		de := &DefaultEngine{
			Topics: sync.Map{},
		}
		go func() {
			timer := time.NewTicker(time.Duration(seconds) * time.Second)
			for {
				select {
				case <-timer.C:
					de.DrainTopicsBuffer()
				}
			}
		}()
		engine = de
		return de, nil
	}
}

// NewTopic will generate a new Topic and assign it into the Topics map, it will also return it
func (de *DefaultEngine) NewTopic(key string) (*Topic, error) {
	if de.TopicExists(key) {
		return nil, ErrTopicAlreadyExists
	}
	t := &Topic{
		Key:         key,
		ID:          newID(),
		Subscribers: make([]*Pipe, 0),
		Buffer: &Pipe{
			Flow: make(chan payload.Payload, 1000),
		},
	}
	de.Topics.Store(key, t)

	return t, nil
}

// TopicExists is used to find out if a topic exists
// will return true if it does, false if not
func (de *DefaultEngine) TopicExists(key string) bool {
	if _, ok := de.Topics.Load(key); ok {
		return true
	}
	return false
}

// getTopic is a help util that does the type assertion for us  so we dont have to repeat
func (de *DefaultEngine) getTopic(key string) (*Topic, error) {
	t, ok := de.Topics.Load(key)
	if !ok {
		return nil, ErrNoSuchTopic
	}
	topic, ok := t.(*Topic)
	if !ok {
		return nil, ErrIsNotTopic
	}
	return topic, nil

}

// Subscribe will take a key and a Pid (processor ID) and Add a new Subscription to a topic
// It will also return the topic used
func (de *DefaultEngine) Subscribe(key string, pid uint, queueSize int) (*Pipe, error) {
	top, err := de.NewTopic(key)
	if errors.Is(err, ErrTopicAlreadyExists) {
		// Topic exists, see if PID is not duplicate
		topic, err := de.getTopic(key)
		if err != nil {
			return nil, err
		}
		for _, sub := range topic.Subscribers {
			if sub.Pid == pid {
				return nil, ErrPidAlreadyRegistered
			}
		}
		top = topic
	}
	// Topic is new , add subscription
	sub := NewPipe(key, pid, queueSize)
	top.Lock()
	top.Subscribers = append(top.Subscribers, sub)
	top.Unlock()
	return sub, nil
}

// Unsubscribe will remove and close a channel related to a subscription
func (de *DefaultEngine) Unsubscribe(key string, pid uint) error {
	if !de.TopicExists(key) {
		return ErrNoSuchTopic
	}
	topic, err := de.getTopic(key)
	if err != nil {
		return err
	}
	topic.Lock()
	defer topic.Unlock()
	pipeline, err := de.removePipeIfExist(key, pid, topic.Subscribers)
	if err != nil {
		return err
	}
	if pipeline != nil {
		topic.Subscribers = pipeline
	}

	return nil
}

// removePipeIfExist is used to delete a index from a pipe slice and return a new slice without it
func (de *DefaultEngine) removePipeIfExist(key string, pid uint, pipes []*Pipe) ([]*Pipe, error) {
	for i, p := range pipes {
		if p.Pid == pid {
			close(p.Flow)
			pipes[i] = pipes[len(pipes)-1]
			return pipes[:len(pipes)-1], nil
		}
	}
	return nil, ErrNoSuchPid
}

// DrainTopicsBuffer will itterate all topics and drain their buffer if there is any subscribers
func (de *DefaultEngine) DrainTopicsBuffer() {
	de.Topics.Range(func(key, value interface{}) bool {
		top, ok := value.(*Topic)
		if !ok {
			return ok
		}
		top.Lock()
		defer top.Unlock()
		xCanReceive := len(top.Subscribers)
		for len(top.Buffer.Flow) > 0 {
			// If no subscriber can Receive more data, stop draining
			if xCanReceive == 0 {
				break
			}
			payload := <-top.Buffer.Flow
			for _, sub := range top.Subscribers {
				select {
				case sub.Flow <- payload:
					// Managed to send item
				default:
					// The pipe is full
					xCanReceive--
				}
			}

		}
		return true
	})
}

// Publish is used to publish a payload onto a Topic
// If there is no Subscribers it will push the Payloads onto a Topic Buffer which will be drained as soon
// As there is a subscriber
func (de *DefaultEngine) Publish(key string, payloads ...payload.Payload) []PublishingError {
	var errors []PublishingError
	var top *Topic
	if de.TopicExists(key) {
		topic, err := de.getTopic(key)
		if err != nil {
			return append(errors, PublishingError{
				Err:     err,
				Payload: nil,
			})
		}
		top = topic
	} else {
		top, _ = de.NewTopic(key)
	}

	// If Subscribers is empty, add to Buffer
	top.Lock()
	defer top.Unlock()
	for _, payload := range payloads {
		if len(top.Subscribers) == 0 {

			select {
			case top.Buffer.Flow <- payload:
				// Managed to send item
			default:
				// The pipe is full
				errors = append(errors, PublishingError{
					Err:     ErrTopicBufferIsFull,
					Payload: payload,
					Tid:     top.ID,
				})
			}
		} else {
			for _, sub := range top.Subscribers {
				select {
				case sub.Flow <- payload:
					// Managed to send
					continue
				default:
					// This Subscriber queue is full,  return an error
					// We Could send items to the Buffer   top.Buffer.Flow <- payload
					// But we would need a way of Knowing what Subscriber has gotten What payload to avoid resending
					// It to all Subscribers
					errors = append(errors, PublishingError{
						Err:     ErrProcessorQueueIsFull,
						Pid:     sub.Pid,
						Tid:     top.ID,
						Payload: payload,
					})
				}
			}
		}
	}
	return errors

}

// PublishTopics is used to publish to many topics at once
func (de *DefaultEngine) PublishTopics(topics []string, payloads ...payload.Payload) []PublishingError {
	var errors []PublishingError

	for _, topic := range topics {
		t := topic
		errs := de.Publish(t, payloads...)
		if errs != nil {
			errors = append(errors, errs...)
		}
	}

	if len(errors) == 0 {
		return nil
	}
	return errors
}

// Cancel stops the Subscriptions
func (de *DefaultEngine) Cancel() {
	//Make it stop drainbuffer
}
