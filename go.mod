module github.com/perbol/workflow

go 1.14

replace github.com/perbol/workflow/register => /home/perbol/development/workflow_2.0/register

require (
	github.com/percybolmer/workflow v0.0.0-20200731123703-5dbbd63a3d0f
	github.com/prometheus/client_golang v1.8.0
	gopkg.in/yaml.v3 v3.0.0-20200615113413-eeeca48fe776
)
