# Workflow

Workflow is a dataflow automazation tool.  
The idea behind workflow is that you should be able to create automated tasks at ease.  

There are a few components that one would need to know more about to develop with workflow. But a regular user should be able to use workflow without too much knowledge about different indepth knowledge. 
To learn more about components and what they do, view [Components](#components-in-workflow)



Workflow is built around [Processors](#processors) that is a component used by workflow to handle the data pipeline.  
It is the processor that handels starting/stopping and making things work.
The idea in workflow is too try to make it as seamless as possible. 

All [Processors](#processors) has to have an [Handler](#handler) assigned before it can start processing any data. It is the handler that contains processing capabilities.
The goal of handlers is to make them as seamless as possible.



## Installation

```bash
go get github.com/percybolmer/workflow
```

## Usage
There are currently 3 different ways of using workflow. 
You can either load processors from a yaml file or you can initialize them by hand. Loading from yaml is the recommended way to avoid alot of coding.  

1. Use the [Tooling](#running-a-workflow-yaml), there is a workflow runner that loads a yaml. This is the most easy to use way, but offers limited flexibility.
2. Use the package in custom codebase. You can generate processors and apply handlers to them and use those to do things. Forexample if your intressted in monitoring a directory for new files and read the contents you could do that and [subscribe](#pubsub) to the output.
3. Use the [loader](#loader) to load a yaml file in your code and run them. 


See examples folder for examples.
[Csv files to Elasticsearch with Filtering](examples/csvToElastic/workflow.yml)
[Creating processor and subscribing to output](examples/inline/readme.MD)

#Components in workflow
Below is a more indepth explaination of all the components that are found in workflow. 
## Processors
Processor is the default component that is used. It is used to make a standarized way of handeling the dataflow, error handeling and metrics.

A processor consists of the following fields

**ID** which is a unique ID that each processor should have. This is done automagically when running [NewProcessor](https://github.com/percybolmer/workflow/blob/5f3faca66d9588cdf87d644ab094f10ba0055f46/processor.go#L92)
**Name** This is a name of the processor, this does not have to be unique, its usage is mainly for the upcomming UI.
**FailureHandler** is the assigned way of handeling errors that occur during processing. See [FailureHandler](#failures).
**Handler** is the processing action to apply, this determines what the processor should be doing. See [Handler](#handler) for more information, and see [HandlerList](handlers/readme.MD).
**Subscriptions** is all the [topics](#pubsub) to listen for data on.
**Topics** is where to send data after processing it. 
**QueueSize** is how many [payloads](#payload)  are allowed to be on queue in the Processor. This is to limit and avoid memory burning if a topic isnt drained.
**Metric** is stored by both the Handler and Processor. The handler will inherit the Processors set metric. The default metric is Prometheus. But this can be changed by the user by setting a new [metricProvider](#metrics). 

## Handler  
Comming soon
## Payload

Comming soon
## Properties 

Comming soon 
## Metrics  

Comming soon
## Pubsub  

Comming soon
## Failures

Comming soon
## Loader


#Tooling

## Running a Workflow yaml
If only interessted in using workflow as a CLI tool then use [runner](tooling/runner). 

After you have downloaded workflow go inside that folder and run

```bash
go build -o runner
./runner -workflow /path/to/workflow.yml -port 2112
```

The port is where to host Prometheus metrics, currently runner only has support for prometheus.

## Building a new Handler
To build a handler one should look at [Handler](#handler) to learn what a Handler is. Any struct that fullfills the [Handler interface](https://github.com/percybolmer/workflow/blob/5f3faca66d9588cdf87d644ab094f10ba0055f46/handlers/handler.go#L13) can be assigned to a Processor.

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