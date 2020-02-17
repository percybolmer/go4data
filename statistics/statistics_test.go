package statistics

import (
	"testing"
)

func TestAddStat(t *testing.T) {
	s := NewStatistics()

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
	s := NewStatistics()

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
