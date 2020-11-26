# List of Handlers
Below is a list of Handlers that exists with a short description.
They are sectioned after package name, each packagename is related to the topic the handler is related to.

## Databases
**PutElasticSearch -** Puts a payload into elasticsearch, expects json
## Files
**ListDirectory -**   
**ReadFile -**  
**WriteFile -**  
## Network
**NetworkInterface -**  
**OpenPcap -**  
## Filters
**Filter -**  
## Parsers
**ParseCSV -**  
## Terminal

**ExecCMD -** Used to execute terminal commands.  
Available configurable properties  
*command* - The command to run from terminal, etc echo. 
*arguments* - The arguments to add to the command, if this list of arguments contains the word payload, It will print the payload of the incomming payload as an argument. It is a Map[string]interface.   
**Stdout -** Prints payloads to stdout
