package readers

import (
	"errors"
	"fmt"

	"github.com/go-redis/redis/v7"
)

const (
	//RedisType is a string containing the value of redis ingested types
	RedisType = "redis"
)

var (
	//ErrNoConnection is thrown when the the conncetion to a redis is not working
	ErrNoConnection error = errors.New("Could not connect to the given host")
)

// RedisReader is a struct that helps reading input from a redis queue
type RedisReader struct {
	Client *redis.Client
}

// redisMsg is the flow handler for redis queue msgs
// redis payloads are limited to 512 MB atm since its a redis settings
type redisMsg struct {
	Payload []byte `json:"payload"`
	Source  string `json:"source"`
	T       string `json:"type"`
}

// Type will return type
func (rm *redisMsg) GetType() string {
	return RedisType
}

// Source will return the source of the redis queue
func (rm *redisMsg) GetSource() string {
	return rm.Source
}

// Payload will return the payload of the redis msg
func (rm *redisMsg) GetPayload() []byte {
	return rm.Payload
}

//NewRedisReader will init the reader with default values, use this to create a new reader to avoid strange behaviour
func NewRedisReader(host, password string, db int) (*RedisReader, error) {
	client := redis.NewClient(
		&redis.Options{
			Addr:     host,
			Password: password,
			DB:       db,
		},
	)
	_, err := client.Ping().Result()
	if err != nil {
		return nil, fmt.Errorf("%s:%w", err, ErrNoConnection)
	}

	return &RedisReader{
		Client: client,
	}, nil
}

// SubscribeTopic is used to listen for input on a certain topic
// any hits will be deliverd on the result channel, and errors on the errorChannel provided
func (r *RedisReader) SubscribeTopic(topic string, resultChan chan<- Flow, errChan chan<- error) {
	redischannel := r.Client.Subscribe(topic)
	defer redischannel.Close()
	// Wait for configurmation that subscribption is actually up before running anything
	_, err := redischannel.Receive()
	if err != nil {
		errChan <- err
		return
	}

	// This is our MessageReceiver channel
	msgChan := redischannel.Channel()

	for msg := range msgChan {
		// Convert each Msg to a proper Flow msg
		resultChan <- &redisMsg{
			Payload: []byte(msg.Payload),
			Source:  topic,
		}
	}
}
