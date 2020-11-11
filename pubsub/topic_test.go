package pubsub

import (
	"errors"
	"testing"

	"github.com/perbol/workflow/payload"
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

func TestDrainBuffer(t *testing.T) {
	Topics = make(map[string]*Topic)

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
	if len(Topics["test"].Buffer.Flow) != 3 {
		t.Fatal("Bad buffer length")
	}
	Subscribe("test", 1, 0)
	sub2, _ := Subscribe("test", 2, 1)
	sub3, _ := Subscribe("test", 3, 2)

	DrainTopicsBuffer()

	if len(Topics["test"].Buffer.Flow) != 1 {
		t.Fatal("Bad buffer length after drain")
	}
	if len(sub2.Flow) != 1 && len(sub3.Flow) != 2 {
		t.Fatal("Bad amount of items in SUB2 and 3")
	}
}

func TestPublish(t *testing.T) {
	Topics = make(map[string]*Topic)

	perr := Publish("test", nil)
	if len(perr) != 0 {
		t.Fatal("Should be no error creating a topic by publishing to it")
	}
	if len(Topics["test"].Buffer.Flow) != 1 {
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
		t.Fatal("Sub didnt recieve Buffer item")
	} else if (len(Topics["test"].Buffer.Flow)) != 0 {
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

func TestUnsubscribe(t *testing.T) {
	Topics = make(map[string]*Topic)
	_, err := Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	if len(Topics["test"].Subscribers) != 1 {
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

	if len(Topics["test"].Subscribers) != 0 {

		t.Fatalf("Wrong length on Subscribers: %d", len(Topics["test"].Subscribers))
	}
}

func TestSubscribe(t *testing.T) {
	Topics = make(map[string]*Topic)
	_, err := Subscribe("test", 1, 1)
	if err != nil {
		t.Fatal(err)
	}

	if len(Topics["test"].Subscribers) != 1 {
		t.Fatal("Wrong length of publishers")
	}

	_, err = Subscribe("test", 1, 1)
	if !errors.Is(err, ErrPidAlreadyRegisterd) {
		t.Fatal("Should have gotten an error that the subcription is already registerd")
	}

	_, err = Subscribe("test", 2, 1)
	if err != nil {
		t.Fatal("Could not add a second publisher")
	}
	if len(Topics["test"].Subscribers) != 2 {
		t.Fatal("Wrong length of Subscribes, should be 2 ")
	}
}
