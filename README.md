# Go4Data

Automate all things  
[![codecov](https://codecov.io/gh/percybolmer/go4data/branch/master/graph/badge.svg?token=E33GL0U61D)](https://codecov.io/gh/percybolmer/go4data)
![go report](https://goreportcard.com/badge/github.com/percybolmer/go4data)
[![MIT license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/percybolmer/go4data)](https://github.com/percybolmer/go4data/stargazers)
![Go](https://github.com/percybolmer/go4data/workflows/Go/badge.svg)
## About Go4Data
Go4Data is a data processing tool.  
The idea behind Go4Data is that you should be able to create automated concurrent data processing flows.  

Go4Data is still under heavy development! 

There are a few components that one would need to know more about to develop with Go4Data. But a regular user should be able to use Go4Data without too much knowledge about different indepth knowledge. 
To learn more about components and what they do, view [Components](#components-in-go4data)


Go4Data is built around [Processors](#processors) that is a component used by Go4Data to handle the data pipeline.  
It is the processor that handels starting/stopping and making things work.
The idea in Go4Data is too try to make it as seamless as possible. 

All [Processors](#processors) has to have an [Handler](#handler) assigned before it can start processing any data. It is the handler that contains processing capabilities.
The goal of handlers is to make them as seamless as possible.

An example of how Go4Data is intended to work with its pubsub system and handlers doing processing seamless .
![Screenshot](https://github.com/percybolmer/go4data/blob/master/resources/go4data.png)

Some people like UML, so I've used Dumels, great job those who made it. 
Here you can see a UML of the project. [Dumels](https://www.dumels.com/diagram/324180ad-864b-4640-9411-4f6678cf8c23)


## Installation

```bash
go get github.com/percybolmer/go4data
```

## Usage
There are currently 3 different ways of using Go4Data. 
You can either load processors from a yaml file or you can initialize them by hand. Loading from yaml is the recommended way to avoid alot of coding.  

1. Use the [Tooling](#running-a-go4data-yaml), there is a Go4Data runner that loads a yaml. This is the most easy to use way, but offers limited flexibility.
2. Use the package in custom codebase. You can generate processors and apply handlers to them and use those to do things. Forexample if your intressted in monitoring a directory for new files and read the contents you could do that and [subscribe](#pubsub) to the output.
3. Use the [loader](#loader) to load a yaml file in your code and run them. 


See examples folder for examples.  
[Csv files to Elasticsearch with Filtering](examples/csvToElastic/README.md)  
[Creating processor and subscribing to output](examples/inline/README.md)  

# Components in Go4Data  
Below is a more indepth explaination of all the components that are found in Go4Data. 
## Processors
Processor is the default component that is used. It is used to make a standarized way of handeling the dataflow, error handeling and metrics.

A processor consists of the following fields

**ID -** which is a unique ID that each processor should have. This is done automagically when running [NewProcessor](https://github.com/percybolmer/go4data/blob/5f3faca66d9588cdf87d644ab094f10ba0055f46/processor.go#L92)
**Name -** This is a name of the processor, this does not have to be unique, its usage is mainly for the upcomming UI.
**FailureHandler -** is the assigned way of handeling errors that occur during processing. See [FailureHandler](#failures).  
**Handler -** is the processing action to apply, this determines what the processor should be doing. See [Handler](#handler) for more information, and see [HandlerList](handlers/README.md).  
**Subscriptions -** is all the [topics](#pubsub) to listen for data on.  
**Topics -** is where to send data after processing it.   
**QueueSize -** is how many [payloads](#payload)  are allowed to be on queue in the Processor. This is to limit and avoid memory burning if a topic isnt drained.  
**Metric -** is stored by both the Handler and Processor. The handler will inherit the Processors set metric. The default metric is Prometheus. But this can be changed by the user by setting a new [metricProvider](#metrics). 
**Workers -** is how many concurrent workers the handler is allowed to run. Modify this only if you want to increase the amount of goroutines your handler should run. This can be increased to make certain handlers work faster, but remember that it can also slow things down if you set too many.

## Handler  
Handler is the data processing unit that will actually do any work. 
Any struct that fulfills the handler interface is allowed to be used by a Processor.   
Handler is an golang interface that looks like this
```golang
// Handler is a interface that allows users to create structs with certain functions attached that can be used inside a processor
// to handle payloads between them.
type Handler interface {
	// Handle is the function that will be performed on the incomming Payloads
	// topics is the topics to push output onto
	Handle(ctx context.Context, payload payload.Payload, topics ...string) error
	// ValidateConfiguration is used to make sure everything that is needed by the handler is set
	ValidateConfiguration() (bool, []string)
	// GetConfiguration will return the configuration slice
	GetConfiguration() *property.Configuration
	//GetHandlerName will return the name used to reference a handler
	GetHandlerName() string
	// Subscriptionless should return true/false wether the handler itself is a self generating handler
	// This is true for handlers like ListDirectory etc, which does not need
	// any inputs to function
	// Setting Subscriptionless to true will actually disable the processor needing subscriptions to work and rely on the Handler to publish itself
	Subscriptionless() bool
	// SetMetricProvider is a function that is used to set a metric provider to a handler.
	// This should be used if you want to output metrics from your handler. Bydefault we use prometheusprovider as a metric provider.
	// A unique prefix also has to be attached since we dont want handler metrics to collide. Bydefault most Processors use Processor.Name + Processor.ID
	SetMetricProvider(p metric.Provider, prefix string) error
	// GetErrorChannel() chan error
	GetErrorChannel() chan error
}

```
Users can write their own Handlers if they want to add functionality.  
The easiest way to start writing a handler is to take a look at [handlergenerator](#building-a-new-handler)


## Payload
Payload is the items that are sent inside the data pipeline.  
Items that are transferred between Processors are called Payloads. It is also interface based, so it is highly customizable and easy to create new payloads.
Too take a look at the currently available payloads see [payload](payload/README.md)  

Payload is a interface that looks like
```golang
// Payload is a interface that will allows different Processors to send data between them in a unified fashion
type Payload interface {
	// GetPayloadLength returns the payload length in flota64
	GetPayloadLength() float64
	// GetPayload will return a byte array with the Payload from the ingress
	// Payload should be limited to 512 MB since thats the MAX cap for a redis payload
	// Also note that JSON payloads will be base64 encoded
	GetPayload() []byte
	// SetPayload will change the values of the payload
	SetPayload([]byte)
	// GetSource should return a string containing the name of the source, etc for a file its the filename or the recdis queue topic
	GetSource() string
	// SetSource should change the value of the source
	SetSource(string)
	// GetMetaData should return a configuration object that contains metadata about the payload
	GetMetaData() *property.Configuration
}
```

It is possible for Payloads to run through the [Filter](#handlers/filters/Filter.go). This is a handler that will remove payloads that does not fulfill any filter requirements. Filters are regexpes that can be run on the payload.  
If a payload is gonna be passed through the Filter, they needed to be part of the Filterable interface. 

```golang
// Filterable is a interface that is used to apply Filters to payloads
type Filterable interface {
	ApplyFilter(f *Filter) bool
}
```

## Properties 
Properties are configurations that are applied to Handlers.  
This is a way of configuring Handlers in a standard way. The [Property](property/README.md) is set by the Handlers.  
A property can be a Required property, which means that a Handler will not start if this property does not contain a correct value. And a property can ofcourse be a nonrequired property, which is an optional configuration. 

It is up to the Handler to make sure that all properties are accounted for, and this is done in [ValidateConfiguartion](https://github.com/percybolmer/go4data/blob/764514cdb32c30f480f1a8823457b8e369dbdf2b/handlers/handler.go#L18) for each handler.

Inside the property package there is also a struct called [Configuration](https://github.com/percybolmer/go4data/blob/764514cdb32c30f480f1a8823457b8e369dbdf2b/property/configurations.go#L6).  
Configuration is used to easier handle Properties inside a Handler.  

## Metrics  
Each Processor has a [MetricProvider](metric/README.md) set that is inherited by the Handlers. 
The goal of a metricprovider is to enable Handlers and Processors to publish metrics about their processing.  
The default is Prometheus metrics, unless changed.


## Pubsub  
Payloads are transported between Handlers by using a [Publish/Subscription](pubsub/README.md) model.  
The main idea is that when processing is done, a payload is published onto a Topic, or Topics. The topics that will be published to is assigned when initializing the Processor with [NewProcessor](https://github.com/percybolmer/go4data/blob/764514cdb32c30f480f1a8823457b8e369dbdf2b/processor.go#L85).  

For another Processor to receive the published payloads, they have to Subscribe on the topics.

Currently there are two supported Pub/Sub engines that Go4Data can use.
It has a DefaultEngine that is set by default and no configuration is needed.
There is also a RedisEngine that allows the user to instead use Redis.

DefaultEngine - Used by default, works great for single node data flows.
RedisEngine - Can be configured to be used, works best if you have multiple Go4Data nodes that all should Pub/Sub on the same Topics.

## Failures
So once in a while, a Processor or Handler may experience errors. This is ofcourse something that wants to be noticed.  
A wrapper around the regular error is used in Go4Data, to add some context and posibility to recreate errors.  

```golang
// Failure is the Go4Datas Custom error handeling struct
// It contains Error and some meta data about what Processor that triggerd the error
type Failure struct {
	// Err is the error that occurred
	Err error `json:"error"`
	// Payload is the payload that was being processed when a Failure occurred
	Payload payload.Payload `json:"payload"`
	// Processor is the UUID of the procesor that triggers the Error
	Processor uint `json:"processor"`
}
```
Failures are handled by the Proccessors assigned [FailureHandler](https://github.com/percybolmer/go4data/blob/764514cdb32c30f480f1a8823457b8e369dbdf2b/processor.go#L35).  
A failurehandler is a simple function that can easily be changed by the user. 
The default failurehandler is [PrintFailure](https://github.com/percybolmer/go4data/blob/764514cdb32c30f480f1a8823457b8e369dbdf2b/failure.go#L28) which will output the Payload into stdout.

The failurehandler looks like
```golang
FailureHandler func(f Failure)
```
## Loader
The loader is used to load go4data yaml configurations into ready-to-use processors. It can also be used to Save configured processors.

The usage is fairly easy.
Example of loading a yml and then saving it again
```golang
    loadedProcessors, err := go4data.Load("testing/loader/loadthis.yml")
    if err != nil {
		t.Fatal(err)
    }
    
   	go4data.Save("testing/loader/loadthis.yml", loadedProcessorss)
```

# Tooling

## Running a Go4Data yaml
If only interessted in using go4data as a CLI tool then use [runner](tooling/runner). 

After you have downloaded go4data inside that folder and run

```bash
go build -o runner
./runner -go4data /path/to/go4data.yml -port 2112
```

The port is where to host Prometheus metrics, currently runner only has support for prometheus.

## Building a new Handler
To build a handler one should look at [Handler](#handler) to learn what a Handler is. Any struct that fullfills the [Handler interface](https://github.com/percybolmer/go4data/blob/5f3faca66d9588cdf87d644ab094f10ba0055f46/handlers/handler.go#L13) can be assigned to a Processor.

To help in building new handlers there is a tooling that will generate a fresh handler for you, the tool can be found [here](tooling/handlergenerator).

This is a code generator that can be used to build a template Handler for you.
Compile the code generator by going into the tooling folder after downloading the source.
run 
```bash
go build -o handlergenerator
./handlergenerator -package $YOURHANDLERPACKAGE -location $HANDLERPACKAGEPATH -templatepath $PATHTOHANDLERTEMPLATE -handler $HANDLERNAME
```
You should now see a new Handler that is generated and be able to use it. 
Offcourse, you still have to do some coding, The generated handler will only print stdout. View other handlers to see how they are setup. 

Example when Creating the pcap reader I ran
```bash 
handlergenerator -package network -location handlers/network -handler OpenPcap
```  
The tooling will use HANDLERGENERATORPATH environment variable to know where the templates are if not specified. The templates can be found [Template Location](tooling/handlergenerator)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
MIT
