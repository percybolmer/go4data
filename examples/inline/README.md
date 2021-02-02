## Creating a Processor and subscribing to output
This example shows how to use go4data as a package instead of a cli tool. 
The first thing to do is to make sure the process you want done is available in [Handlers](https://github.com/percybolmer/go4data/blob/master/handlers/README.md)

The code belows shows how to list directories and read all the files
```golang
	listDirProc := NewProcessor("listdir", "found_files")
    readFileProc := NewProcessor("readfile", "file_data")
    
    // Assign the correct Handlers
    listDirProc.SetHandler(files.NewListDirectoryHandler())
    readFileProc.SetHandler(files.NewReadFileHandler())

    // Setup configurations for both Handlers if other than default behavior is wanted
    listConfig := listDirProc.GetConfiguration()
	err := listConfig.SetProperty("path", "path/to/files")
	if err != nil {
		t.Fatal(err)
    }
    // Unsafe but faster way to set a Configuration
    readFileProc.GetConfiguration().SetProperty("remove_after", false)
    // Files found by listDirProc is published to found_files, so we want to read on that topic
    readFileProc.Subscribe("found_files")
    // Start processing
    	if err := listDirProc.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := readFileProc.Start(context.Background()); err != nil {
		t.Fatal(err)
    }
    // Now to get data we need to subscribe to a topic
    // this can be done without a processor
    pipe, err := pubsub.Subscribe(topic, readFileProc.ID, p.QueueSize)
	if err != nil {
		return err
    }

    // Pipe is a data channel with Payloads, can be used 
    



```