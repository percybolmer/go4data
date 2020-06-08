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
#processor
Processor is an interface that is passed between 
#readers
Readers are tools to read in from data source, such as a filereader to handle file reading
#cmd
