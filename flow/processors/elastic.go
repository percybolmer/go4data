//Package processors s
// This file contains processors related to ElasticSearch
package processors

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/percybolmer/workflow/flow"
	"github.com/percybolmer/workflow/readers"
	"github.com/percybolmer/workflow/statistics"
)

// ElasticOutput is used to output the content of an flow into an ElasticSearch DB
func ElasticOutput(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	// Replace customStrcut with Custom struct
	var elasticReaderConf readers.ElasticConfig
	err := json.Unmarshal(confByte, &elasticReaderConf)
	if err != nil {
		inflow.Log(err)
		return
	}
	// Setup ElasticReader
	er, err := readers.NewElasticReader(elasticReaderConf.Addresses, elasticReaderConf.Username, elasticReaderConf.Password)
	if err != nil {
		inflow.Log(err)
		return
	}

	if elasticReaderConf.Index == "" {
		inflow.Log(errors.New("Cannot have an ElasticOutput setup without an index configured"))
		return
	}
	// Get waitgroup to correctly handle Gorotuines shutting down and waiting
	wg := inflow.GetWaitGroup()
	// Set egress for follow up flow
	egress := make(chan flow.Payload)
	inflow.SetEgressChannel(egress)

	go func() {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case payload := <-inflow.GetIngressChannel():
				inflow.Statistics.AddStat(fmt.Sprintf("%s_ingress_flows", inflow.ProcessorName), "Number of ingress flows", statistics.CounterType, 1)
				inflow.Statistics.AddStat(fmt.Sprintf("%s_ingress_bytes", inflow.ProcessorName), "Number of ingress bytes", statistics.GaugeType, payload.GetPayloadLength())

				// Send the Payload to the Index
				err := er.WriteIndex(elasticReaderConf.Index, payload.GetPayload())
				if err != nil {
					inflow.Log(err)
					continue
				}
				// Add Stats
				inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_flows", inflow.ProcessorName), "Number of egress flows", statistics.CounterType, 1)
				inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_bytes", inflow.ProcessorName), "Number of egress bytes", statistics.GaugeType, payload.GetPayloadLength())

				egress <- payload
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}
