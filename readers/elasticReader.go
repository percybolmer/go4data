//Package readers - elasticReader is used to handle Input/ouput from Elasticsearch clusters
package readers

import (
	"crypto/tls"
	"errors"
	"net"
	"net/http"
	"time"

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
}

// NewElasticReader is used to generate a new working ElasticReader instance
func NewElasticReader(addresses []string, username, password string) (*ElasticReader, error) {
	if len(addresses) == 0 {
		return
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
