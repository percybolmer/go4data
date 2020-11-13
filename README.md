# Workflow

Workflow is a dataflow automazation tool.  
It constists of 2 components.  
There are Processors which are the default component. Processors are used to transport data between 
one another. They can be used to manage the data pipeline.  
A processor can publish to many topics or subscribe to many topics.  
It uses a Pub/Sub system to manage how data flows between processors.  

A processor cannot do any data processing by itself. Each processor has a Handler assigned to it, it is this handler that does the processing.  
A Handler has to be assigned to start a processor.

## Installation

```bash
go get github.com/percybolmer/workflow
```

## Usage
Soon an Examples folder is comming with better examples

```golang
readFileProc := NewProcessor("readfile", "file_data")
handler := files.NewReadFileHandler()
readFileProc.SetHandler(handler)

if err := readFileProc.Start(context.Background()); err != nil {
	log.Fatal(err)
}
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
MIT