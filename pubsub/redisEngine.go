package pubsub

import (
	"context"
	"errors"
	"fmt"

	"github.com/go-redis/redis/v8"
	"github.com/percybolmer/go4data/payload"
)

// RedisEngine is a way to use the Redis Pub/Sub instead of the Default
// Use this if you want to scale the Go4Data into multiple instances and share work
// Between more nodes
type RedisEngine struct {
	Options *redis.Options
	Client  *redis.Client
	cancel  context.CancelFunc
}

var (
	//ErrNoRedisClientConfigured is thrown when the RedisEngine client is nil
	ErrNoRedisClientConfigured = errors.New("the redis client in the engine is nil")
	// ErrRedisSubscriptionIsNil is when the redisclient returns nil from Subscribe
	ErrRedisSubscriptionIsNil = errors.New("the return from Subscribe was nil")
)

// WithRedisEngine will configure the Pub/Sub to use Redis instead
func WithRedisEngine(opts *redis.Options) DialOptions {
	return func(e Engine) (Engine, error) {
		re := &RedisEngine{}
		// Connect to Redis
		client := redis.NewClient(opts)
		// Ping to make sure connection works
		err := client.Ping(context.Background()).Err()
		if err != nil {
			return nil, err
		}
		re.Client = client
		engine = re
		return re, nil
	}
}

// Cancel stops the Subscriptions
func (re *RedisEngine) Cancel() {
	re.cancel()
}

// Subscribe will subscribe to a certain Redis channel
func (re *RedisEngine) Subscribe(key string, pid uint, queueSize int) (*Pipe, error) {
	if re.Client == nil {
		return nil, ErrNoRedisClientConfigured
	}
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	re.cancel = cancel
	subscription := re.Client.Subscribe(ctx, key)
	if subscription == nil {
		return nil, ErrRedisSubscriptionIsNil
	}

	// Force wakeup
	if _, err := subscription.Receive(ctx); err != nil {
		return nil, err
	}
	// Grab the Channel that we will use for our Pipe
	channel := subscription.ChannelSize(queueSize)

	// This needs some trick to it, Channel will return a []byte, but we want Payloads
	// Best solution I can come up with is a Goroutine that transfers from one channel to another..
	// This isn't optimal, since we need to force BasePayload...
	// Maybe Another refactor is needed in the future
	// Where Instead of returnning a Pipe we return a Chan interface
	pipe := &Pipe{
		Flow:  make(chan payload.Payload, queueSize),
		Topic: key,
	}
	go func() {
		for {
			select {
			case msg := <-channel:
				bp := &payload.BasePayload{}

				err := bp.UnmarshalBinary([]byte(msg.Payload))
				if err != nil {
					// Bad Payloads? Send Errors as Payloads?.... Add ErrorHandler to Engine?
					fmt.Println(err.Error())
				} else {
					pipe.Flow <- bp
				}
			case <-ctx.Done():
				subscription.Close()
				return
			}
		}
	}()
	return pipe, nil

}

// Publish will push payloads onto the Redis topic
func (re *RedisEngine) Publish(key string, payloads ...payload.Payload) []PublishingError {
	var errors []PublishingError
	if re.Client == nil {
		errors := append(errors, PublishingError{
			Err: ErrNoRedisClientConfigured,
		})
		return errors
	}
	for _, pay := range payloads {
		data, err := pay.MarshalBinary()
		if err != nil {
			errors = append(errors, PublishingError{
				Err:     err,
				Payload: pay,
			})
			continue
		}
		err = re.Client.Publish(context.Background(), key, data).Err()
		if err != nil {
			errors = append(errors, PublishingError{
				Err:     err,
				Payload: pay,
			})
			continue
		}
	}
	return errors

}

// PublishTopics is used to publish to many topics at the same time
func (re *RedisEngine) PublishTopics(topics []string, payloads ...payload.Payload) []PublishingError {
	var errors []PublishingError
	// Itterate all Topics and publish payloads onto all of them
	for _, topic := range topics {
		t := topic
		errs := re.Publish(t, payloads...)
		if errs != nil {
			errors = append(errors, errs...)
		}
	}

	if len(errors) == 0 {
		return nil
	}
	return errors

}
