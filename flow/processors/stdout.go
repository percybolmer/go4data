package processors

import (
	"fmt"

	"github.com/percybolmer/workflow/flow"
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
				f.Statistics.AddStat("ingress_flows", 1)
				f.Statistics.AddStat("ingress_bytes", len(payload.GetPayload()))
				f.Statistics.AddStat("egress_flows", 1)
				f.Statistics.AddStat("egress_bytes", len(payload.GetPayload()))
				fmt.Println(fmt.Sprintf("Source: %s: \nPayload: %s", payload.GetSource(), payload.GetPayload()))
				outputChannel <- payload
			case <-f.StopChannel:
				return
			}
		}
	}()

}
