package pubsub

import (
	"errors"
	"sync"
	"testing"

	"github.com/percybolmer/go4data/payload"
)

func TestWithDefaultEngine(t *testing.T) {
	NewEngine(WithDefaultEngine(2))

	pipe, err := Subscribe("test", 1, 10)

	if err != nil {
		t.Fatal(err)
	}
	// Test publish and Subscribe
	Publish("test", payload.NewBasePayload([]byte(`Hello World from DefaultEngine`), "test", nil))
	// Pipe should now have 1 item in it
	if len(pipe.Flow) != 1 {
		t.Log(len(pipe.Flow))
		t.Fatal("Data was not Published properly with DefaultEngine")
	}
}
func TestNewTopic(t *testing.T) {
	de := &DefaultEngine{
		Topics: sync.Map{},
	}
	top, err := de.NewTopic("this")
	if err != nil {
		t.Fatal("Should have been able to create first topic")
	}
	if top == nil {
		t.Fatal("Topic should not have been nil")
	}

	top, err = de.NewTopic("this")
	if !errors.Is(err, ErrTopicAlreadyExists) {
		t.Fatal("Didnt trigger the correct error")
	}

	if top != nil {
		t.Fatal("Topic should not be nil")
	}
}

func TestGetTopic(t *testing.T) {
	de := &DefaultEngine{
		Topics: sync.Map{},
	}
	_, err := de.NewTopic("thisexists")
	if err != nil {
		t.Fatal(err)
	}

	topic, err := de.getTopic("doesnotexist")
	if !errors.Is(err, ErrNoSuchTopic) {
		t.Fatal("Got the wrong error when fetching a non existing topic ", err.Error())
	}
	if topic != nil {
		t.Fatal("Topic should be nil when it does not exist")
	}

	// Hack a bad item into topic
	de.Topics.Store("baditem", 1)
	topic, err = de.getTopic("baditem")
	if !errors.Is(err, ErrIsNotTopic) {
		t.Fatal("Should have detected that this is not a topic item")
	}

	topic, err = de.getTopic("thisexists")
	if err != nil {
		t.Fatal("Error should be nil when item exists")
	}
	if topic == nil {
		t.Fatal("Topic should not be nil when it does exist")
	}

}

func TestSubscribe(t *testing.T) {
	de := &DefaultEngine{Topics: sync.Map{}}
	_, err := de.Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	topicInterface, ok := de.Topics.Load("test")
	if !ok {
		t.Fatal("Should have found an test item")
	}
	topic := topicInterface.(*Topic)

	if len(topic.Subscribers) != 1 {
		t.Fatal("Wrong length of publishers")
	}

	_, err = de.Subscribe("test", 1, 1)
	if !errors.Is(err, ErrPidAlreadyRegistered) {
		t.Fatal("Should have gotten an error that the subcription is already Registered")
	}

	_, err = de.Subscribe("test", 2, 1)
	if err != nil {
		t.Fatal("Could not add a second publisher")
	}
	if len(topic.Subscribers) != 2 {
		t.Fatal("Wrong length of Subscribes, should be 2 ")
	}
}

func TestUnsubscribe(t *testing.T) {
	de := &DefaultEngine{Topics: sync.Map{}}
	_, err := de.Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	topic, err := de.getTopic("test")
	if err != nil {
		t.Fatal(err)
	}
	if len(topic.Subscribers) != 1 {
		t.Fatal("Wrong length of Subscribers")
	}

	err = de.Unsubscribe("nosuchkey", 1)
	if !errors.Is(err, ErrNoSuchTopic) {
		t.Fatal("Got the wrong error in first unsubscribe")
	}

	err = de.Unsubscribe("test", 2)
	if !errors.Is(err, ErrNoSuchPid) {
		t.Fatal("Should have gotten a ErrNoSuchPid when removing a pid that does not exist")
	}

	err = de.Unsubscribe("test", 1)
	if err != nil {
		t.Fatal("Error should be nil when removing a PID that exists")
	}

	if len(topic.Subscribers) != 0 {

		t.Fatalf("Wrong length on Subscribers: %d", len(topic.Subscribers))
	}
}

func TestPublish(t *testing.T) {
	de := &DefaultEngine{Topics: sync.Map{}}
	perr := de.Publish("test", nil)
	if len(perr) != 0 {
		t.Fatal("Should be no error creating a topic by publishing to it")
	}
	topic, err := de.getTopic("test")
	if err != nil {
		t.Fatal(err)
	}
	if len(topic.Buffer.Flow) != 1 {
		t.Fatal("Buffer should be 1")
	}

	sub, err := de.Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	if len(sub.Flow) != 0 {
		t.Fatal("Length of flow should be 0")
	}

	// Drain buffer and sub.Flow should be = 1
	de.DrainTopicsBuffer()
	if len(sub.Flow) != 1 {
		t.Fatal("Sub didnt Receive Buffer item")
	} else if (len(topic.Buffer.Flow)) != 0 {
		t.Fatal("didnt properly Empty buffer")
	}
	// Register new SUB too see that its handled properly when queue is full
	sub2, err := de.Subscribe("test", 2, 1)
	if err != nil {
		t.Fatal(err)
	}
	// Now Queue Should be full and we should geta Queue is full Err from Sub
	// But sub2 should have 1 item in queue
	perr = de.Publish("test", &payload.BasePayload{
		Source: "test",
	})
	if len(perr) != 1 {
		if !errors.Is(perr[0].Err, ErrProcessorQueueIsFull) {
			t.Fatal("Should have reported Queue Full on sub1")
		}
	}
	if len(sub.Flow) != 1 {
		t.Fatal("Flow should now have 1 item in queue")
	}
	if len(sub2.Flow) != 1 {
		t.Fatal("Sub2.Flow should still have the new item in queue")
	}
}

func TestPublishTopics(t *testing.T) {
	de := &DefaultEngine{Topics: sync.Map{}}
	// Create full topic
	top := &Topic{
		Key:         "topic2",
		ID:          newID(),
		Subscribers: make([]*Pipe, 0),
		Buffer: &Pipe{
			Flow: make(chan payload.Payload, 1),
		},
	}
	de.Topics.Store("topic2", top)

	topics := []string{"topic1", "topic2"}

	puberrs := de.PublishTopics(topics, nil)
	if len(puberrs) != 0 {
		t.Fatal("should see 0 errors")
	}

	puberrs = de.PublishTopics(topics, nil)
	if len(puberrs) != 1 {
		t.Fatal("Should see atleast 1 puberror")
	}
}

func TestDrainBuffer(t *testing.T) {
	de := &DefaultEngine{Topics: sync.Map{}}
	// Scenario to test is this
	// 3 Subscribers
	// SUB 1 is Full
	// Sub 2 Is empty with 1 spot left
	// Sub 3 is empty with 2 spot left
	// Buffer has 3 Items in queue
	// After drain Buffer should have 1 item in queue since all Subs are full
	de.Publish("test", nil)
	de.Publish("test", nil)
	de.Publish("test", nil)

	topic, err := de.getTopic("test")
	if err != nil {
		t.Fatal(err)
	}
	if len(topic.Buffer.Flow) != 3 {
		t.Fatal("Bad buffer length")
	}
	de.Subscribe("test", 1, 0)
	sub2, _ := de.Subscribe("test", 2, 1)
	sub3, _ := de.Subscribe("test", 3, 2)

	de.DrainTopicsBuffer()

	if len(topic.Buffer.Flow) != 1 {
		t.Fatal("Bad buffer length after drain")
	}
	if len(sub2.Flow) != 1 && len(sub3.Flow) != 2 {
		t.Fatal("Bad amount of items in SUB2 and 3")
	}
}
