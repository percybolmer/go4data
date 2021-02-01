# List of Handlers
Below is a list of Handlers that exists with a short description.
They are sectioned after package name, each packagename is related to the topic the handler is related to.

## Databases
**PutElasticSearch -** Takes incomming payloads and sends them to an ElasticSearch index.

| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| index  | string  | A string that represents the index name (will automatically add a yy-mm-dd timestamp to index)
| ip | string | The ip address of the elastic node
| port | int | The port of the elastic node
| type | string | The elastic type to use, this is related to the mapping of elasticsearch.
| version | string | The elastic version to use, current supported versions are 6.x and 7.x
## Files
**ListDirectory -** Monitors a directory for files, any new files is sent out on the topics.
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| buffertime  | int  | An integer in seconds on how long to store found files in memory, stored files will not be outputted during this duration.
| path | string | The path to the directory to monitor.  

**ReadFile -** Reads a file on the system and outputs the content. Expects payloads that come in to be a string with the path.
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| remove_after  | boolean  | Setting this to true will remove the file after its read  

**WriteFile -** Outputs the content of incomming payloads into files.
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| path  | string  | The path to where the files will be written.
| append | boolean | Setting it to true it will append the content of payloads into a single file. False value will generate new files per payload.
| forward | boolean | Setting it to true will send payloads onto topics after written. 
| pid | int | Set the PID for the written files. Defaults to 1000.
| gid | int | Set the GID for the written files. Defaults to 1000.

## Network
**NetworkInterface -** Start listening on a network interface for Packets and output them as payloads
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| bpf  | string  | If a Bpf filter should be applied.
| snapshotlength | int | The length of snapshots.
| promiscuousmode | boolean | If promiscuousmode should be enabled or not.
| interface | string | the interface to read packets from  

**OpenPcap -** Reads pcap files and output packets.
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| bpf  | string  | If a Bpf filter should be applied.
## Filters
**Filter -** Reads incomming payloads and see if they are Filterable. Then applies configured filters on the payloads, only outputs payloads that matches the filters.
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| strict  | []string  | A slice of the filter groups to apply strict mode to, strict mode means that all filters in that group has to match.
| filterDirectory | string | A path to a directory containing filter files. A Filter file is named after the filter group and contains key:regexp rows.
| filters | map[string][]string | Filters is a configuration that can be used to apply filters inline. The map key is the filter group, then a slice of key:regexp values.  
## Parsers
**ParseCSV -** Reads incomming payloads and tries to parse them as CSV. Reading them and extracting header information, will output CSVPayloads.
Available configurable properties  
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| delimiter  | string  | The delimiter to use on the incomming payloads
| headerlength | int | How many rows the header is.
| skiprows | int | How many rows in the payload to skip before starting to parse
## Terminal

**ExecCMD -** Used to execute terminal commands.  
Available configurable properties  
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| command  | string  | The command to run from terminal, etc echo
| arguments  | map[string]interface  | The arguments to add to the command, if this list of arguments contains the word payload, It will print the payload of the incomming payload as an argument.
   
**Stdout -** Prints payloads to stdout
Available configurable properties  
| Properties  | Type | Description |
| ------------- | ------------- | ------------- |
| forward  | boolean  | Setting it to true will forward payload onto configured topics.
