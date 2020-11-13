package pubsub

import (
	"errors"
	"time"

	"github.com/percybolmer/workflow/payload"
)

// Topics is a container for topics that has been created.
// A topic is automatically created when a Processor registers as a Subscriber to it
var Topics map[string]*Topic

var (
	//ErrTopicAlreadyExists is thrown when running NewTopic on a topic that already exists
	ErrTopicAlreadyExists = errors.New("this topic does already exist, cannot create a duplicate topic")
	//ErrPidAlreadyRegisterd is thrown when trying to publish/subscribe with a processor already publishing/subscribing on a certain topic
	ErrPidAlreadyRegisterd = errors.New("the pid is already registerd, duplicate Pub/Subs not allowed")
	//ErrNoSuchTopic is a error that can be thrown when no topic is found
	ErrNoSuchTopic = errors.New("thrown when no topic is found")
	//ErrNoSuchPid is when no Pid in a topic is found
	ErrNoSuchPid = errors.New("no such pid was found on this topic")

	//ErrProcessorQueueIsFull is when a Publisher is trying to publish to a queue that is full
	ErrProcessorQueueIsFull = errors.New("cannot push new payload since queue is full")
	//ErrTopicBufferIsFull is when a Publisher is trying to publish to a Topic that has a full buffer
	ErrTopicBufferIsFull = errors.New("cannot push new payload since topic queue is full")

	//IDCounter is used to make sure no Topic are generated with a ID that already exists
	IDCounter uint = 1
)

// Init will create the Topic register
func init() {
	Topics = make(map[string]*Topic)

	go func() {
		timer := time.NewTicker(2 * time.Second)

		for {
			select {
			case <-timer.C:
				DrainTopicsBuffer()
			}
		}
	}()
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
}

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

// newID is used to generate a new ID
func newID() uint {
	IDCounter++
	return IDCounter - 1
}

// NewTopic will generate a new Topic and assign it into the Topics map, it will also return it
func NewTopic(key string) (*Topic, error) {
	if TopicExists(key) {
		return nil, ErrTopicAlreadyExists
	}
	Topics[key] = &Topic{
		Key:         key,
		ID:          newID(),
		Subscribers: make([]*Pipe, 0),
		Buffer: &Pipe{
			Flow: make(chan payload.Payload, 1000),
		},
	}
	return Topics[key], nil
}

// TopicExists is used to find out if a topic exists
// will return true if it does, false if not
func TopicExists(key string) bool {
	if _, ok := Topics[key]; ok {
		return true
	}
	return false
}

// DrainTopicsBuffer will itterate all topics and drain their buffer if there is any subscribers
func DrainTopicsBuffer() {
	for _, top := range Topics {
		xCanRecieve := len(top.Subscribers)
		for len(top.Buffer.Flow) > 0 {
			// If no subscriber can recieve more data, stop draining
			if xCanRecieve == 0 {
				break
			}
			payload := <-top.Buffer.Flow
			for _, sub := range top.Subscribers {
				select {
				case sub.Flow <- payload:
					// Managed to send item
				default:
					// The pipe is full
					xCanRecieve--
				}
			}

		}
	}
}

// Unsubscribe will remove and close a channel related to a subscription
func Unsubscribe(key string, pid uint) error {
	if !TopicExists(key) {
		return ErrNoSuchTopic
	}
	pipeline, err := removePipeIfExist(key, pid, Topics[key].Subscribers)
	if err != nil {
		return err
	}
	if pipeline != nil {
		Topics[key].Subscribers = pipeline
	}
	return nil
}

// removePipeIfExist is used to delete a index from a pipe slice and return a new slice without it
func removePipeIfExist(key string, pid uint, pipes []*Pipe) ([]*Pipe, error) {
	for i, p := range pipes {
		if p.Pid == pid {
			close(p.Flow)
			pipes[i] = pipes[len(pipes)-1]
			return pipes[:len(pipes)-1], nil
		}
	}
	return nil, ErrNoSuchPid
}

// Subscribe will take a key and a Pid (processor ID) and Add a new Subscription to a topic
// It will also return the topic used
func Subscribe(key string, pid uint, queueSize int) (*Pipe, error) {
	top, err := NewTopic(key)
	if errors.Is(err, ErrTopicAlreadyExists) {
		// Topic exists, see if PID is not duplicate
		for _, sub := range Topics[key].Subscribers {
			if sub.Pid == pid {
				return nil, ErrPidAlreadyRegisterd
			}
		}
		top = Topics[key]
	}
	// Topic is new , add subscription
	sub := NewPipe(key, pid, queueSize)
	top.Subscribers = append(top.Subscribers, sub)

	return sub, nil
}

// Publish is used to publish a payload onto a Topic
// If there is no Subscribers it will push the Payloads onto a Topic Buffer which will be drained as soon
// As there is a subscriber
func Publish(key string, payload payload.Payload) []PublishingError {
	var errors []PublishingError
	var top *Topic
	if TopicExists(key) {
		top = Topics[key]
	} else {
		top, _ = NewTopic(key)
	}

	// If Subscribers is empty, add to Buffer
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
	return errors

}
