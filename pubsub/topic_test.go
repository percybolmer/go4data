package pubsub

import (
	"errors"
	"sync"
	"testing"

	"github.com/percybolmer/workflow/payload"
)

func TestNewTopic(t *testing.T) {
	top, err := NewTopic("this")
	if err != nil {
		t.Fatal("Should have been able to create first topic")
	}
	if top == nil {
		t.Fatal("Topic should not have been nil")
	}

	top, err = NewTopic("this")
	if !errors.Is(err, ErrTopicAlreadyExists) {
		t.Fatal("Didnt trigger the correct error")
	}

	if top != nil {
		t.Fatal("Topic should not be nil")
	}
}

func TestGetTopic(t *testing.T) {
	Topics = sync.Map{}
	_, err := NewTopic("thisexists")
	if err != nil {
		t.Fatal(err)
	}

	topic, err := getTopic("doesnotexist")
	if !errors.Is(err, ErrNoSuchTopic) {
		t.Fatal("Got the wrong error when fetching a non existing topic ", err.Error())
	}
	if topic != nil {
		t.Fatal("Topic should be nil when it does not exist")
	}

	// Hack a bad item into topic
	Topics.Store("baditem", 1)
	topic, err = getTopic("baditem")
	if !errors.Is(err, ErrIsNotTopic) {
		t.Fatal("Should have detected that this is not a topic item")
	}

	topic, err = getTopic("thisexists")
	if err != nil {
		t.Fatal("Error should be nil when item exists")
	}
	if topic == nil {
		t.Fatal("Topic should not be nil when it does exist")
	}

}

func TestSubscribe(t *testing.T) {
	Topics = sync.Map{}
	_, err := Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	topicInterface, ok := Topics.Load("test")
	if !ok {
		t.Fatal("Should have found an test item")
	}
	topic := topicInterface.(*Topic)

	if len(topic.Subscribers) != 1 {
		t.Fatal("Wrong length of publishers")
	}

	_, err = Subscribe("test", 1, 1)
	if !errors.Is(err, ErrPidAlreadyRegistered) {
		t.Fatal("Should have gotten an error that the subcription is already Registered")
	}

	_, err = Subscribe("test", 2, 1)
	if err != nil {
		t.Fatal("Could not add a second publisher")
	}
	if len(topic.Subscribers) != 2 {
		t.Fatal("Wrong length of Subscribes, should be 2 ")
	}
}

func TestUnsubscribe(t *testing.T) {
	Topics = sync.Map{}
	_, err := Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	topic, err := getTopic("test")
	if err != nil {
		t.Fatal(err)
	}
	if len(topic.Subscribers) != 1 {
		t.Fatal("Wrong length of Subscribers")
	}

	err = Unsubscribe("nosuchkey", 1)
	if !errors.Is(err, ErrNoSuchTopic) {
		t.Fatal("Got the wrong error in first unsubscribe")
	}

	err = Unsubscribe("test", 2)
	if !errors.Is(err, ErrNoSuchPid) {
		t.Fatal("Should have gotten a ErrNoSuchPid when removing a pid that does not exist")
	}

	err = Unsubscribe("test", 1)
	if err != nil {
		t.Fatal("Error should be nil when removing a PID that exists")
	}

	if len(topic.Subscribers) != 0 {

		t.Fatalf("Wrong length on Subscribers: %d", len(topic.Subscribers))
	}
}

func TestPublish(t *testing.T) {
	Topics = sync.Map{}

	perr := Publish("test", nil)
	if len(perr) != 0 {
		t.Fatal("Should be no error creating a topic by publishing to it")
	}
	topic, err := getTopic("test")
	if err != nil {
		t.Fatal(err)
	}
	if len(topic.Buffer.Flow) != 1 {
		t.Fatal("Buffer should be 1")
	}

	sub, err := Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	if len(sub.Flow) != 0 {
		t.Fatal("Length of flow should be 0")
	}

	// Drain buffer and sub.Flow should be = 1
	DrainTopicsBuffer()
	if len(sub.Flow) != 1 {
		t.Fatal("Sub didnt Receive Buffer item")
	} else if (len(topic.Buffer.Flow)) != 0 {
		t.Fatal("didnt properly Empty buffer")
	}
	// Register new SUB too see that its handled properly when queue is full
	sub2, err := Subscribe("test", 2, 1)
	if err != nil {
		t.Fatal(err)
	}
	// Now Queue Should be full and we should geta Queue is full Err from Sub
	// But sub2 should have 1 item in queue
	perr = Publish("test", payload.BasePayload{
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
	Topics = sync.Map{}

	// Create full topic
	top := &Topic{
		Key:         "topic2",
		ID:          newID(),
		Subscribers: make([]*Pipe, 0),
		Buffer: &Pipe{
			Flow: make(chan payload.Payload, 1),
		},
	}
	Topics.Store("topic2", top)

	topics := []string{"topic1", "topic2"}

	puberrs := PublishTopics(topics, nil)
	if len(puberrs) != 0 {
		t.Fatal("should see 0 errors")
	}

	puberrs = PublishTopics(topics, nil)
	if len(puberrs) != 1 {
		t.Fatal("Should see atleast 1 puberror")
	}
}

func TestDrainBuffer(t *testing.T) {
	Topics = sync.Map{}
	// Scenario to test is this
	// 3 Subscribers
	// SUB 1 is Full
	// Sub 2 Is empty with 1 spot left
	// Sub 3 is empty with 2 spot left
	// Buffer has 3 Items in queue
	// After drain Buffer should have 1 item in queue since all Subs are full
	Publish("test", nil)
	Publish("test", nil)
	Publish("test", nil)

	topic, err := getTopic("test")
	if err != nil {
		t.Fatal(err)
	}
	if len(topic.Buffer.Flow) != 3 {
		t.Fatal("Bad buffer length")
	}
	Subscribe("test", 1, 0)
	sub2, _ := Subscribe("test", 2, 1)
	sub3, _ := Subscribe("test", 3, 2)

	DrainTopicsBuffer()

	if len(topic.Buffer.Flow) != 1 {
		t.Fatal("Bad buffer length after drain")
	}
	if len(sub2.Flow) != 1 && len(sub3.Flow) != 2 {
		t.Fatal("Bad amount of items in SUB2 and 3")
	}
}
