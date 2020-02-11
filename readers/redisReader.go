package readers

import (
	"errors"
	"fmt"

	"github.com/go-redis/redis"
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

// @TODO ADD ABLIITY TO PUBLISH TO TOPICS
// ALSO MAKE 2 Functions for Publish(flow) And Subscribe(flow)
func (r *RedisReader) Publish() error {
	return nil
}
