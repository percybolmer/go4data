## CSV files to ElasticSearch
This workflow file would be an example how to setup the ingestion of CSV files
and output them to a Elastic database.

The workflow could be started by running 

```golang
wf, err := workflow.Load("workflow.yml")
if err != nil {
	log.Fatal(err)
}

ctx := context.Background()
for _, proc := range wf {
	if err := proc.Start(ctx); err != nil {
		log.Fatal(err)
	}
}

```

The workflow file in this case would look like
```yaml
- id: 1
  name: listdirectory
  running: false
  topics:
    - found_files
  subscriptions: []
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
            - name: path
              value: /app/ingress
              description: the path to search for
              required: true
              valid: false
            - name: buffertime
              value: 3600
              description: the time in seconds for how long a found file should be rememberd and not relisted
              required: false
              valid: false
    handler_name: ListDirectory
- id: 2
  name: readfile
  running: false
  topics:
    - file_data
  subscriptions:
    - found_files
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
            - name: remove_after
              value: true
              description: This property is used to configure if files that are read should be removed after
              required: true
              valid: false
    handler_name: ReadFile
- id: 3
  name: csvparser
  running: false
  topics:
    - csv_filter
  subscriptions:
    - file_data
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
            - name: delimiter
              value: '|'
              required: true
              valid: true
            - name: skiprows
              value: 1
              required: false
              valid: true
    handler_name: ParseCSV
- id: 4
  name: Filter
  running: false
  topics:
    - filterd_data
  subscriptions:
    - csv_filter
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
        - name: strict
          value: 
            - active
          required: true
          valid: true
        - name: filterDirectory
          value: /app/filters
          required: true
          valid: true
    handler_name: Filter
- id: 5
  name: execCmd
  running: false
  topics:
    - topic_1
  subscriptions:
    - filterd_data
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
            - name: command
              value: /app/csvtojson/csvtojson
              required: true
              valid: true
            - name: arguments
              value: 
                - -input
                - '"payload"'
              required: false
              valid: true
    handler_name: ExecCMD 
- id: 7
  name: stdout
  running: false
  subscriptions:
    - topic_1
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
            - name: forward
              value: false
              required: true
              valid: true
    handler_name: Stdout
- id: 7
  name: elasticlog
  running: false
  subscriptions:
    - topic_1
  executioninterval: 10s
  queuesize: 1000
  handler:
    configs:
        properties:
            - name: index
              value: filteredcsv
              required: true
              valid: true
            - name: ip
              value: 127.0.0.1
            - name: port
              value: 9200
            - name: type
              value: csv
            - name: version
              value: "7.2"
    handler_name: PutElasticSearch


```