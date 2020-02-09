package readers

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

type basecase struct {
	TestName      string
	Host          string
	Password      string
	DB            int
	Topic         string
	ExpectedError error
}

func TestNewRedisReader(t *testing.T) {
	type testCase struct {
		basecase
	}

	cases := []testCase{
		{basecase{"correctHost", "localhost:6379", "", 0, "", nil}},
		{basecase{"badhost", "localhost:5555", "", 0, "", ErrNoConnection}},
	}

	for _, tc := range cases {
		_, err := NewRedisReader(tc.Host, tc.Password, tc.DB)
		if !errors.Is(err, tc.ExpectedError) {
			t.Fatalf("%s:%v", tc.TestName, err)
		}
	}
}
func TestSubscribeTopic(t *testing.T) {
	type testCase struct {
		basecase
		topic string
	}

	cases := []testCase{
		{basecase{"correctHost", "localhost:6379", "", 0, "", nil}, "devel"},
	}

	for _, tc := range cases {
		rr, err := NewRedisReader(tc.Host, tc.Password, tc.DB)
		if err != nil {
			t.Fatal(err)
		}
		resultChan := make(chan Flow)
		errChan := make(chan error)
		go rr.SubscribeTopic("devel", resultChan, errChan)

		ticker := time.NewTicker(2 * time.Second)
		publishTicker := time.NewTicker(1 * time.Second)
		// Start ticker and make it trigger done
		for {
			select {
			case <-publishTicker.C:
				err := rr.Client.Publish("devel", "hello world").Err()
				if err != nil {
					t.Fatal(err)
				}
			case <-ticker.C:
				return
			case r := <-resultChan:
				fmt.Println(string(r.GetPayload()))
			case err := <-errChan:
				if !errors.Is(err, tc.ExpectedError) {
					t.Fatalf("%s:%v", tc.TestName, err)
				}
			}
		}

	}
}
