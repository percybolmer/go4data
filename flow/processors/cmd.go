package processors

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"strings"

	"github.com/percybolmer/workflow/flow"
)

type cmd struct {
	Command string `json:"command"`
	// Arguments should be a json map with Flag: value
	Arguments []string `json:"arguments"`
}

// Cmd processor is used to execute other binaries / Linux terminal on the workflow and ingest that stdout into a payload
func Cmd(inflow *flow.Flow) {
	confByte := inflow.GetConfiguration()

	var conf cmd
	err := json.Unmarshal(confByte, &conf)
	if err != nil {
		inflow.Log(err)
		return
	}

	// Get waitgroup to correctly handle Gorotuines shutting down and waiting
	wg := inflow.GetWaitGroup()
	// Set egress for follow up flow
	egress := make(chan flow.Payload)
	inflow.SetEgressChannel(egress)
	// Do stuff with ur processor, either sent egress payloads once or start goroutine to handle flow that should maintain
	go func() {
		defer wg.Done()
		wg.Add(1)
		for {
			select {
			case payload := <-inflow.GetIngressChannel():
				// Execute Cmd command on payload
				// Build a Argument Slice
				var command string
				for _, value := range conf.Arguments {

					if strings.Contains(value, "payload") {
						// If value contains payload it will use it to insert the payloads Payload
						ploud := strings.Replace(value, "payload", string(payload.GetPayload()), -1)
						command += " " + ploud
					} else {
						command += " " + value
					}
				}
				command = conf.Command + command
				fullCmd := exec.Command("bash", "-c", command)
				var stdout, stderr bytes.Buffer
				fullCmd.Stderr = &stderr
				fullCmd.Stdout = &stdout
				err := fullCmd.Run()
				if err != nil {
					inflow.Log(fmt.Errorf("%s:%w", fullCmd.String(), err))
					continue
				}
				errStr := string(stderr.Bytes())
				if errStr != "" {
					inflow.Log(errors.New(errStr))
					continue
				}
				newpayload := &flow.BasePayload{}
				newpayload.SetPayload(stdout.Bytes())
				newpayload.SetSource(fullCmd.String())
				egress <- newpayload
			case <-inflow.StopChannel:
				return
			}
		}
	}()
}
