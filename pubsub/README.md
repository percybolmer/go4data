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
Using the pubsub system usually only needs 2 functions.
Its the publish and Subscribe methods.

### Subscribing
To subscribe one needs to call the Subscribe function and give the correct key to the topic.

Subscribe accepts 3 parameters, Topicname, A unique ID for the subscriber, and a QueueSize that will change how many payloads you accept to be put on hold.

To stop subscribing call the Unsubscribe method. This will accept the Topic and the Unique ID of the subscriber. 


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