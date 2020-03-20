package readers

import (
	"testing"
	"time"
)

func TestRedisPublish(t *testing.T) {
	rd, err := NewRedisReader("127.0.0.1:6379", "", 0)
	if err != nil {
		t.Fatal(err)
	}

	err = rd.Publish("testqueue", []byte(`hejsan`))
	if err != nil {
		t.Fatal(err)
	}

	pbsub, err := rd.Subscribe("test")
	if err != nil {
		t.Fatal(err)
	}
	time.AfterFunc(time.Second*2, func() {
		pbsub.Close()
	})

	err = rd.Publish("test", []byte(`hej2`))
	if err != nil {
		t.Fatal(err)
	}

}
