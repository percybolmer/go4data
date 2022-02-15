# PubSub in workflow
Workflow leverages a simple pubsub model to transfer data between components. 
There can be many subscribers and publishers to any topic. However there can only be one processor ID registred per topic. This means that a Processor with ID 1 cannot register twice on a topic.

## Topics
A topic is a key that is used to reference a dataflow. A Topic contains a key which is the unique name. 

Topics also has Subscribers that registers when they want the data from it. 
And there is the Buffer. The buffer is the channel that holds data that has been published. As soon as a subscriber comes the buffer will empty all the payloads it has in store. 

## Subscriptions
Subscription is a way for the Topic to output data. When subscribing to a topic the subscriber will recieve a channel of payloads. 

## Usage
Using the pubsub system usually only needs 3 methods.
Its the publish, publishTopics and Subscribe methods.
Depending on the Engine used they will work diffrently.
The Engine interface explains best how the methods is used.
```golang
// Engine is a interface that declares what methods a pub/sub engine needs in Go4Data
type Engine interface {
	Publish(key string, payloads ...payload.Payload) []PublishingError
	PublishTopics(topics []string, payloads ...payload.Payload) []PublishingError
	Subscribe(key string, pid uint, queueSize int) (*Pipe, error)
	Cancel()
}
```

## Engine
There are two Engines supported by Go4Data.

DefaultEngine - Set by default, a high speed in-memory Pub/Sub system using go channels.

RedisEngine - Allows you to use Redis as a Pub/Sub instead of DefaultEngine. It is slower, but has many advantages. 
It can allow you to Subscribe or Publish to topics that are outside of Go4Data scope, or comming from another Go4Data node. 

To swich the Engine used you can use the NewEngine method. The below example shows to set both Engines (DefaultEngine is applied automatically)
```golang
// This shows how to change the whole Go4Data to use Redis instead
_, err := pubsub.NewEngine(WithRedisEngine(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
})


// This is how we would change back to DefaultEngine
_, err := pubsub.NewEngine(WithDefaultEngine(2))

```

### Subscribing
To subscribe one needs to call the Subscribe function and give the correct key to the topic.

Subscribe accepts 3 parameters, Topicname, A unique ID for the subscriber, and a QueueSize that will change how many payloads you accept to be put on hold.

To stop subscribing call the Unsubscribe method. This will accept the Topic and the Unique ID of the subscriber. 
Note unsubscribing is currently only supported by DefaultEngine, for Redis, just close the connection using Close.

```golang
  channel, err := pubsub.Subscribe("MyTopic", 1, 1)
  if err != nil {
      t.Fatal(err)
  }

  pubsub.Unsubscribe("MyTopic", 1)
```
### Publishing
To publish payloads one will use the following 2 alternatives
Publish will accept one Topic, and a variadic payload input.
PublishTopics will accept many topics and also a variadic amount of payloads.
```golang
    // Publish to one topic
    perr := pubsub.Publish("MyTopic", nil)
	if len(perr) != 0 {
		t.Fatal("Should be no error creating a topic by publishing to it")
    }
    
    // Publish to many topics
    topics := []string{ "Mytopic", "AnotherTopic", "ThirdTOpic"}
    perr := pubsub.PublishTopics(topics, nil)
	if len(perr) != 0 {
		t.Fatal("Should be no error creating a topic by publishing to it")
    }
```