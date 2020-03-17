package processors

import (
	"fmt"

	"github.com/percybolmer/workflow/flow"
	"github.com/percybolmer/workflow/statistics"
)

// Stdout is a processor used to print Information about the payloads recieved on a Flow
// This is mainly used for debugging
func Stdout(f *flow.Flow) {
	// Print any Payload set, or any payload from any EgressChannel
	if f.GetIngressChannel() == nil {
		f.Log(flow.ErrNoIngressChannel)
		return
	}

	wg := f.GetWaitGroup()
	defer wg.Done()
	wg.Add(1)

	outputChannel := make(chan flow.Payload, flow.DefaultBufferSize)
	f.SetEgressChannel(outputChannel)

	go func() {
		for {
			select {
			case payload := <-f.GetIngressChannel():
				fmt.Println(string(payload.GetPayload()))
				f.Statistics.AddStat("stdout_ingress_flows", "Stdout input flows files", statistics.CounterType, 1)
				f.Statistics.AddStat("stdout_ingress_bytes", "Stdout input bytes", statistics.GaugeType, payload.GetPayloadLength())
				f.Statistics.AddStat("stdout_egress_flows", "Stdout egress flow files", statistics.CounterType, 1)
				f.Statistics.AddStat("stdout_egress_bytes", "Stdout egress bytes", statistics.GaugeType, payload.GetPayloadLength())
				outputChannel <- payload
			case <-f.StopChannel:
				return
			}
		}
	}()

}
