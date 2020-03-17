// Package processors files contains File releated Processors
package processors

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/percybolmer/workflow/statistics"

	"github.com/percybolmer/filewatcher"
	"github.com/percybolmer/workflow/flow"
	"github.com/percybolmer/workflow/readers"
)

// ReadFile will read the bytes from a file and set them as the current payload
func ReadFile(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	fr := readers.FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		inflow.Log(err)
		return
	}

	payload, err := fr.Read(fr.Path)
	if err != nil {
		inflow.Log(err)
		return
	}
	// Add stats about the payload
	inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_bytes", inflow.ProcessorName), "Total number of bytes read", statistics.GaugeType, float64(len(payload)))
	inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_flows", inflow.ProcessorName), "Total number of files read", statistics.CounterType, 1)

	outChan := make(chan flow.Payload, 1)
	inflow.SetEgressChannel(outChan)

	output := &flow.BasePayload{}
	output.SetPayload(payload)
	output.SetSource(fr.Path)
	outChan <- output

}

// WriteFile will take a Flows Payload and write it to file
func WriteFile(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	fr := readers.FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		inflow.Log(err)
		return
	}

	if fr.Path == "" {
		inflow.Log(readers.ErrInvalidPath)
		return
	}
	outChan := make(chan flow.Payload)
	inflow.SetEgressChannel(outChan)
	wg := inflow.GetWaitGroup()
	go func() {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case newflow := <-inflow.GetIngressChannel():
				// TODO add Epoch timestamp for unique names
				inflow.Statistics.AddStat(fmt.Sprintf("%s_ingress_flows", inflow.ProcessorName), "Number of ingress flows", statistics.CounterType, 1)
				inflow.Statistics.AddStat(fmt.Sprintf("%s_ingress_bytes", inflow.ProcessorName), "Number of ingress bytes", statistics.GaugeType, newflow.GetPayloadLength())
				file := filepath.Base(newflow.GetSource())
				err := fr.WriteFile(fmt.Sprintf("%s/%s", fr.Path, file), newflow.GetPayload())
				if err != nil {
					inflow.Log(err)
					continue
				}
				// Add stats about the payload
				inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_flows", inflow.ProcessorName), "Number of egress flows", statistics.CounterType, 1)
				inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_bytes", inflow.ProcessorName), "Number of egress bytes", statistics.GaugeType, newflow.GetPayloadLength())
				outChan <- newflow
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}

// MonitorDirectory is used to read from a directory for a given time
func MonitorDirectory(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()
	fr := readers.FileReader{}

	err := json.Unmarshal(confByte, &fr)
	if err != nil {
		inflow.Log(err)
		return
	}
	// Make sure directory exists
	if _, err := os.Stat(fr.Path); os.IsNotExist(err) {
		inflow.Log(err)
		return
	}
	filechannel := make(chan string)
	watcher := filewatcher.NewFileWatcher()
	watcher.ChangeExecutionTime(1)

	wg := inflow.GetWaitGroup()

	go watcher.WatchDirectory(filechannel, fr.Path)
	folderPath := fr.Path
	egressChannel := make(chan flow.Payload)
	inflow.SetEgressChannel(egressChannel)
	// Start a goroutine to watch over the filechannel and Ingest the new Files
	go func(filechannel chan string, inflow *flow.Flow, egressChannel chan flow.Payload) {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case newFile := <-filechannel:
				inflow.Statistics.AddStat(fmt.Sprintf("%s_ingress_files", inflow.ProcessorName), "The number of files found by the watcher", statistics.CounterType, 1)
				file := filepath.Base(newFile)
				var filePath string
				if strings.HasSuffix(folderPath, "/") {
					filePath = fmt.Sprintf("%s%s", folderPath, file)
				} else {
					filePath = fmt.Sprintf("%s/%s", folderPath, file)
				}
				bytes, err := fr.Read(filePath)
				if err != nil {
					inflow.Log(err)
					continue
				}
				if len(bytes) != 0 {
					payload := &flow.BasePayload{}
					payload.SetSource(filePath)
					payload.SetPayload(bytes)
					// Add stats about the payload
					inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_files", inflow.ProcessorName), "The number of output files, can differ from input", statistics.CounterType, 1)
					inflow.Statistics.AddStat(fmt.Sprintf("%s_egress_bytes", inflow.ProcessorName), "The number of outbyte bytes", statistics.GaugeType, payload.GetPayloadLength())

					egressChannel <- payload
				}
				if fr.RemoveAfterRead {
					os.Remove(filePath)
				}
			case <-inflow.StopChannel:
				return
			}

		}
	}(filechannel, inflow, egressChannel)
	return
}

// ParseCsvFlow is used to parse a CsvFlow
// It will output a new Flow with a EgressChannel setup that all csvRows will be sent to
// as separate Flows
func ParseCsvFlow(f *flow.Flow) {
	cr := readers.NewCsvReader()
	err := json.Unmarshal(f.GetConfiguration(), cr)
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
			case newinput := <-ingress:
				rows, err := cr.ParseCsv(newinput.GetPayload())
				if err != nil {
					f.Log(err)
					continue
				}
				// Add stats about the payload
				f.Statistics.AddStat(fmt.Sprintf("%s_ingress_bytes", f.ProcessorName), "Ingress bytes", statistics.GaugeType, newinput.GetPayloadLength())
				f.Statistics.AddStat(fmt.Sprintf("%s_ingress_flows", f.ProcessorName), "Ingress flows", statistics.CounterType, 1)
				// Each row is going to become its own output Flow on egressChannel
				var outputBytes int
				if len(rows) != 0 {
					for _, payload := range rows {
						outputBytes += len(payload.GetPayload())
						payload.SetSource(newinput.GetSource())
						egressChannel <- payload
					}
				}
				f.Statistics.AddStat(fmt.Sprintf("%s_egress_bytes", f.ProcessorName), "Egress bytes for CSV parser", statistics.GaugeType, float64(outputBytes))
				f.Statistics.AddStat(fmt.Sprintf("%s_egress_flows", f.ProcessorName), "Number of egress CSV Rows", statistics.CounterType, float64(len(rows)))

			case <-f.StopChannel:
				return
			}
		}
	}()
	return

}
