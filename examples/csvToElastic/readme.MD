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