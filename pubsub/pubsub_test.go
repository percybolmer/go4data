package pubsub

import (
	"testing"

	"github.com/go-redis/redis/v8"
	"github.com/percybolmer/go4data/payload"
)

// We create the redisEngine to avoid including  connection time during the tests
var redisEngine Engine
var defaultEngine Engine

// Also some Slices with preset data
var hundredthousanPayloads []payload.Payload
var thousandPayloads []payload.Payload
var onehundred []payload.Payload

func init() {
	// Initialize all needed items before tests in here
	var err error
	redisEngine, err = NewEngine(WithRedisEngine(&redis.Options{
		Addr:     "localhost:6379",
		Password: "",
		DB:       0,
	}))
	if err != nil {
		panic(err)
	}
	defaultEngine, err = NewEngine(WithDefaultEngine(10))
	if err != nil {
		panic(err)
	}
	hundredthousanPayloads = generatePayloads(100000)
	thousandPayloads = generatePayloads(1000)
	onehundred = generatePayloads(100)
}

// generatePayloads is used to generate payloads at startup to avoid calculating this inside the benchmark
func generatePayloads(amount int) []payload.Payload {
	payloads := make([]payload.Payload, amount)
	for n := 0; n < amount; n++ {
		payloads[n] = payload.NewBasePayload([]byte(`Test payload`), "benchmarking", nil)
	}
	return payloads
}

// BenchmarkDefaultEnginePubSub1000000 will take 1000000 payloads and Publish them and see if the Subscriber has received all items
func BenchmarkDefaultEnginePubSub100000(b *testing.B) {
	// Start DefaultEngine and Publish 1000 Payloads
	benchmarkDefaultEnginePubSub(hundredthousanPayloads, b)
}

// BenchmarkDefaultEnginePubSub1000 will take 1000 payloads and Publish them and see if the Subscriber has received all items
func BenchmarkDefaultEnginePubSub1000(b *testing.B) {
	// Start DefaultEngine and Publish 1000 Payloads
	benchmarkDefaultEnginePubSub(thousandPayloads, b)
}

// BenchmarkDefaultEnginePubSub100 will take 100 payloads and Publish them and see if the Subscriber has received all items
func BenchmarkDefaultEnginePubSub100(b *testing.B) {
	benchmarkDefaultEnginePubSub(onehundred, b)
}

// This benchmark function is used to Test the time for both Publishing and regathering the total amount published.
func benchmarkDefaultEnginePubSub(payloads []payload.Payload, b *testing.B) {
	//for n := 0; n < b.N; n++ {
	pipe, err := defaultEngine.Subscribe("benchmark", newID(), 100000)
	if err != nil {
		b.Fatal(err)
	}
	defaultEngine.Publish("benchmark", payloads...)
	for len(pipe.Flow) != len(payloads) {
	}
	//}
}

// BenchmarkDefaultEnginePub1000000 will take 1000000 payloads and Publish
func BenchmarkDefaultEnginePub100000(b *testing.B) {
	// Start DefaultEngine and Publish 1000 Payloads
	benchmarkDefaultEnginePub(hundredthousanPayloads, b)
}

// BenchmarkDefaultEnginePub1000 will take 1000 payloads and Publish
func BenchmarkDefaultEnginePub1000(b *testing.B) {
	// Start DefaultEngine and Publish 1000 Payloads
	benchmarkDefaultEnginePub(thousandPayloads, b)
}

// BenchmarkDefaultEnginePub100 will take 100 payloads and Publish
func BenchmarkDefaultEnginePub100(b *testing.B) {
	benchmarkDefaultEnginePub(onehundred, b)
}

// this benchmark is used to test the time for only Publishing
func benchmarkDefaultEnginePub(payloads []payload.Payload, b *testing.B) {
	for n := 0; n < b.N; n++ {
		defaultEngine.Publish("benchmark", payloads...)
	}
}

// BenchmarkRedisEnginePub100000 will Publish 1000000 items onto redis and time it
func BenchmarkRedisEngine100000(b *testing.B) {
	benchmarkRedisEnginePub(hundredthousanPayloads, b)
}

// BenchmarkRedisEnginePub1000 will Publish 1000 items onto redis and time it
func BenchmarkRedisEngine1000(b *testing.B) {
	benchmarkRedisEnginePub(thousandPayloads, b)
}

// BenchmarkRedisEnginePub100 will Publish 100 items onto redis and time it
func BenchmarkRedisEngine100(b *testing.B) {
	benchmarkRedisEnginePub(onehundred, b)
}

// benchmarkRedisEnginePub will Publish X items onto redis and time it
func benchmarkRedisEnginePub(payloads []payload.Payload, b *testing.B) {
	for n := 0; n < b.N; n++ {
		redisEngine.Publish("benchmark", payloads...)
	}
}

// BenchmarkRedisEnginePubSub100000 will Publish 1000000 items onto redis and time it  and Subscribe to the output aswell
func BenchmarkRedisEnginePubSub100000(b *testing.B) {
	benchmarkRedisEnginePubSub(hundredthousanPayloads, b)
}

// BenchmarkRedisEnginePubSub1000 will Publish 1000 items onto redis and time it  and Subscribe to the output aswell
func BenchmarkRedisEnginePubSub1000(b *testing.B) {
	benchmarkRedisEnginePubSub(thousandPayloads, b)
}

// BenchmarkRedisEnginePubSub100 will Publish 100 items onto redis and time it and Subscribe to the output aswell
func BenchmarkRedisEnginePubSub100(b *testing.B) {
	benchmarkRedisEnginePubSub(onehundred, b)
}

// benchmarkRedisEnginePubSub will Publish X items onto redis and wait until subscriber has them all
func benchmarkRedisEnginePubSub(payloads []payload.Payload, b *testing.B) {
	//for n := 0; 0 < b.N; n++ {

	pipe, err := redisEngine.Subscribe("benchmark", newID(), 1000000)
	if err != nil {
		b.Fatal(err)
	}
	defer redisEngine.Cancel()
	redisEngine.Publish("benchmark", payloads...)

	for len(pipe.Flow) != len(payloads) {

	}

	//}
}
