package pubsub

import (
	"testing"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/percybolmer/go4data/payload"
)

func TestWithRedisEngine(t *testing.T) {
	_, err := NewEngine(WithRedisEngine(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	}))

	if err != nil {
		t.Fatal(err)
	}
}

func TestRedisSubscribePublish(t *testing.T) {
	_, err := NewEngine(WithRedisEngine(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	}))

	if err != nil {
		t.Fatal(err)
	}

	pipe, err := Subscribe("test", 1, 10)
	if err != nil {
		t.Fatal(err)
	}
	Publish("test", payload.NewBasePayload([]byte(`Hello Redis Engine`), "test", nil))

	time.Sleep(2 * time.Second)
	if len(pipe.Flow) != 1 {
		t.Fatal("Didn't find any payloads on the subscription")
	}
}

func TestRedisPublishTopics(t *testing.T) {
	_, err := NewEngine(WithRedisEngine(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	}))

	if err != nil {
		t.Fatal(err)
	}

	pipe, err := Subscribe("test", 1, 1000)
	if err != nil {
		t.Fatal(err)
	}
	pipe2, err := Subscribe("wordly", 1, 1000)
	if err != nil {
		t.Fatal(err)
	}
	puberr := PublishTopics([]string{"test", "wordly"}, payload.NewBasePayload([]byte(`Hello Redis Engine`), "test", nil))
	if puberr != nil {
		for _, err := range puberr {
			t.Fatal(err.Error())
		}
	}
	time.Sleep(3 * time.Second)
	if len(pipe.Flow) != 1 {
		t.Fatal("First pipe didnt receive item: len=", len(pipe.Flow))
	} else if len(pipe2.Flow) != 1 {
		t.Fatal("Second pipe didnt get item: len=", len(pipe2.Flow))
	}

}
