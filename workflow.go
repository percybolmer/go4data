//Package workflow is
package workflow

import (
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/percybolmer/workflow/flow"
	"github.com/percybolmer/workflow/flow/processors"
	"github.com/percybolmer/workflow/statistics"
	"github.com/rs/zerolog"
)

//Workflow is a whole workflow chain, it contains Processors that are executed in the order of the Procesors Slice
type Workflow struct {
	// Name is the name of the flow
	Name       string       `json:"name"`
	Processors []*flow.Flow `json:"processors"`
	// TODO currently only File based logging is allowed, change this to any wanted type.....if requested
	Logger  zerolog.Logger `json:"-"`
	LogPath string         `json:"logpath"`
	// Statistics is struct containing metadata about statistics, workflow has one, but its rarely used at the moment
	// Only an global error_count is used, It would be cool if WorkFlow could itterate all Flows
	// and sort of "group" all stats together for a general overview.
	Statistics *statistics.Statistics `json:"stastistics"`
}

// AddFlow adds a flow to the processor slice
// TODO should this function Close and restart- How is that handled
// until then, Users need to close and rerun on their own
func (w *Workflow) AddFlow(newflow *flow.Flow) {
	w.Processors = append(w.Processors, newflow)
}

// SetupLogging is used to enable configured Logging
func (w *Workflow) SetupLogging() {
	if w.LogPath == "" {
		w.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	} else {
		date := time.Now().Format("02-01-2006")
		f, err := os.OpenFile(fmt.Sprintf("%s/%s-%s", w.LogPath, w.Name, date), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			// TODO how do I solve errors before the workflows are initialized?, right now jst stdout, but in the future?
			w.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
			w.Logger.Log().Msgf("Error setting up logger: %s", err)
		}
		w.Logger = zerolog.New(f).With().Timestamp().Logger()
	}
}

// StartLogging will enable logging for a flow
func (w *Workflow) StartLogging(wg *sync.WaitGroup, inflow *flow.Flow) {
	defer wg.Done()
	wg.Add(1)
	go func() {
		for {
			select {
			case err := <-inflow.ErrorChannel:
				if err != nil {
					w.Logger.Log().Msg(err.Error())
				}
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}

// Start will trigger an ingress in a goroutine and listen on that goroutine
func (w *Workflow) Start(wg *sync.WaitGroup) {
	w.SetupLogging()
	//fmt.Println("Workflow: ", w.Name, "  has X amount of Processors configured ", len(w.Processors))
	for index, flow := range w.Processors {
		flow.SetWaitGroup(wg)
		if p, ok := processors.ProcessorMap[flow.ProcessorName]; ok {
			if index > 0 {
				//  Channels are passed by reference by default. Thats why I have made these GetEgress/SetEgress to transfer
				// the channel properly between flows
				flow.SetIngressChannel(w.Processors[index-1].GetEgressChannel())
			}

			p(flow)
			w.StartLogging(wg, flow)

		} else {
			// No Processor found with that Task name, Log?
			w.Logger.Log().Str("No such processor found", flow.ProcessorName).Str("workflow", w.Name).Msg("Exiting current workflow")
			w.Close()
			return

		}
	}
}

// Close will itterate all processors and close them
func (w *Workflow) Close() {
	for _, flow := range w.Processors {
		flow.Close()
	}
}
