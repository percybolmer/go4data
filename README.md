##workflow

Workflow is a tool to automate tasks, alot like Nifi but the idea is more to target workflows inside code apps rather than a standalone program
Imagine Having an go application that needs to do some repetetive tasks, then workflow is perfekt

#application
Application is a container for workflows, a application is the highest level of container,
It has a name and a slice of workflows, since an app can have alot of different automatic tasks

#workflow
A workflow is a set of processors to run in a orderd manner.
A good example is a workflow that needs to collect data
from a stream of CSV files and output the rows into a db or redis queue.
The data between the workflow processors is shares by sending flows between the processors.


Subpackages needs documentation aswell
#flow
Flow is a struct that has everything that is needed to share data between the processors
To communicate the processors sends flows to eachother.

A flow contains a few channels used to communicate
IngressChannel is a channel that will be used to get data into the flow.
The IngressChannel will be set automatically to the previous flows EgressChannel
The first flow of a workflow will have no Ingress set, thats why its important that the first
configuerd processor in the workflow is used to collect any data, etc readfile or subscribeRedisQueue

#processors

#readers
#cmd
