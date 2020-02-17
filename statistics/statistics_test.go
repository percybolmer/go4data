package statistics

import (
	"testing"
	"time"
)

var baseduration time.Duration = 10 * time.Second

func TestAddStat(t *testing.T) {
	s := NewStatistics(baseduration)

	s.AddStat("bytes", 10)

	if s.Stats["bytes"] != 10 {
		t.Fatal("The statistic bytes has wrong value")
	}
	s.AddStat("bytes", 10)
	if s.Stats["bytes"] != 20 {
		t.Fatal("The statistic bytes has not been appended correctly, wrong value returned")
	}
}

func TestGetStat(t *testing.T) {
	s := NewStatistics(baseduration)

	s.AddStat("bytes", 10)

	value, err := s.GetStat("bytes")
	if err != nil || value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %d", err, value)
	}

	value, err = s.GetStat("noexisting")
	if err == nil || value != -1 {
		t.Fatalf("Failed second get test, Err is: %v and value is = %d", err, value)
	}
}
func TestResetStat(t *testing.T) {
	s := NewStatistics(baseduration)

	s.AddStat("bytes", 10)

	value, err := s.GetStat("bytes")
	if err != nil || value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %d", err, value)
	}
	s.ResetStats()

	value, err = s.GetStat("bytes")
	if value != -1 || err != ErrNoSuchStat {
		t.Fatalf("Failed to reset stats")
	}
}

func TestStart(t *testing.T) {
	s := NewStatistics(2 * time.Second)

	s.AddStat("bytes", 10)
	value, err := s.GetStat("bytes")
	if err != nil || value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %d", err, value)
	}

	time.Sleep(2 * time.Second)

	// Now the stats should have reset properly

	s.GetStat("bytes")
	value, err = s.GetStat("bytes")
	if value != -1 || err != ErrNoSuchStat {
		t.Fatalf("Failed to reset stats")
	}
}
