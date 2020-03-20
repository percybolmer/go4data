package processors

import (
	"encoding/json"
	"fmt"

	"github.com/percybolmer/workflow/flow"
	"github.com/percybolmer/workflow/readers"
	"github.com/percybolmer/workflow/statistics"
)

// FilterConfig is used to store all the needed data that should be filterd
// A hardmatch means all values has to match, while a softmatch means
// only 1 value has to match
// Any Key Values will be mapped to the input payload
type FilterConfig struct {
	ValueMap  map[string]string `json:"values"`
	Hardmatch bool              `json:"hardmatch"`
}

// FilterStringMap will take input paylaod
// that is a Map[string]string
// It will filter out any matching values
func FilterStringMap(f *flow.Flow) {
	conf := FilterConfig{}
	err := json.Unmarshal(f.GetConfiguration(), &conf)
	if err != nil {
		f.Log(err)
		return
	}

	ingress := f.GetIngressChannel()
	if ingress == nil {
		f.Log(readers.ErrNeedAnIngressChannel)
		return
	}
	egressChannel := make(chan flow.Payload)
	f.SetEgressChannel(egressChannel)
	wg := f.GetWaitGroup()
	go func() {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case input := <-ingress:
				go func() {
					defer wg.Done()
					wg.Add(1)
					// Make sure Input is a Map[string]string ?
					row := make(map[string]string, 0)
					err := json.Unmarshal(input.GetPayload(), &row)
					if err != nil {
						f.Log(err)
						return
					}
					// Publish Ingress values? or skip?

					foundMatches := 0
					requiredMatches := len(conf.ValueMap)
					// Go through all ConfigValues
					for key, value := range conf.ValueMap {
						// See if key even exists in input
						if inputValue, ok := row[key]; ok {
							// Match and see if they fit
							if value == inputValue {
								foundMatches++
							}
						}
						// Config value does not exists? Should I log this anyway or?
					}
					if conf.Hardmatch {
						if foundMatches == requiredMatches {
							goto Forward
						}
					} else {
						if foundMatches >= 1 {
							goto Forward
						}
					}
					goto End

				Forward:
					egressChannel <- input
					f.Statistics.AddStat(fmt.Sprintf("%s_egress_flows", f.ProcessorName), "The number of flows that has matched the required values", statistics.CounterType, 1)
					f.Statistics.AddStat(fmt.Sprintf("%s_egress_bytes", f.ProcessorName), "The number of bytes that has passed through and matched the required values", statistics.GaugeType, input.GetPayloadLength())
				End:
					return
				}()
			case <-f.StopChannel:
				return
			}
		}
	}()

	return

}
