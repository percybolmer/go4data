//Package readers - elasticReader is used to handle Input/ouput from Elasticsearch clusters
package readers

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/elastic/go-elasticsearch/esapi"

	"github.com/elastic/go-elasticsearch"
)

var (
	// ErrNoAddresses
	ErrNoAddresses = errors.New("The addresses cannot be empty, please add addresses")
)

// ElasticReader is a utility struct to help usage of elasticsearch clusters
type ElasticReader struct {
	esClient *elasticsearch.Client
}

// ElasticConfig is a representation of all the configs needed for a elasticreader
type ElasticConfig struct {
	Addresses []string `json:"addresses"`
	Username  string   `json:"username"`
	Password  string   `json:"password"`
	Index string `json:"index"`
}

// NewElasticReader is used to generate a new working ElasticReader instance
func NewElasticReader(addresses []string, username, password string) (*ElasticReader, error) {
	if len(addresses) == 0 {
		return nil, ErrNoAddresses
	}
	cfg := elasticsearch.Config{
		Addresses: addresses,
		Username:  username,
		Password:  password,
		Transport: &http.Transport{
			MaxIdleConnsPerHost:   10,
			ResponseHeaderTimeout: time.Second,
			DialContext:           (&net.Dialer{Timeout: time.Second}).DialContext,
			TLSClientConfig: &tls.Config{
				MinVersion: tls.VersionTLS11,
			},
		},
	}

	es, err := elasticsearch.NewClient(cfg)
	if err != nil {
		return nil, err
	}
	// Extra check to see that connection is working
	_, err = es.Info()
	if err != nil {
		return nil, err
	}

	return &ElasticReader{
		esClient: es,
	}, nil
}

// ReadIndex will read items from a certain index
func (es *ElasticReader) ReadIndex() {
	// #TODO
	// Somehow we should read INdexes, but We cannot read whole index as that may result in millions of hits
	// Maybe split into Query Index and One Search Index based on timeline?
}

// WriteIndex is used to insert payloads into Certain index
func (es *ElasticReader) WriteIndex(index string, payload []byte) error {
	// Create context to use for requests
	ctx := context.Background()

	req := esapi.IndexRequest{
		Index: index,
		Body:  bytes.NewReader(payload),
	}

	res, err := req.Do(ctx, es.esClient)
	if err != nil {
		return fmt.Errorf("%v:%w", err, "Failed to updated the index")
	}
	defer res.Body.Close()

	if res.IsError() {
		return fmt.Errorf("%v:%w", res.Status(), "Failed to update the index")
	}
	return nil

}
