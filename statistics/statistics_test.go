package statistics

import (
	"testing"
	"time"
)

var baseduration time.Duration = 10 * time.Second

func TestAddStat(t *testing.T) {
	s := NewStatistics(baseduration, false)

	s.AddStat("bytes", "number of processed bytes", GaugeType, 10)

	if s.Stats["bytes"].Value != 10 {
		t.Fatal("The statistic bytes has wrong value")
	}
	s.AddStat("bytes", "number of processed bytes", GaugeType, 10)
	if s.Stats["bytes"].Value != 20 {
		t.Fatal("The statistic bytes has not been appended correctly, wrong value returned")
	}
}

func TestGetStat(t *testing.T) {
	s := NewStatistics(baseduration, true)

	s.AddStat("bytes", "devel", GaugeType, 10)

	stat, err := s.GetStat("bytes")
	if err != nil || stat.Value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %f", err, stat.Value)
	}

	stat, err = s.GetStat("noexisting")
	if err == nil || stat != nil {
		t.Fatalf("Failed second get test, Err is: %v and value is = %f", err, stat.Value)
	}
}
func TestResetStat(t *testing.T) {
	s := NewStatistics(baseduration, true)

	s.AddStat("bytes", "devel", GaugeType, 10)

	stat, err := s.GetStat("bytes")
	if err != nil || stat.Value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %f", err, stat.Value)
	}
	s.ResetStats()

	stat, err = s.GetStat("bytes")
	if stat != nil || err != ErrNoSuchStat {
		t.Fatalf("Failed to reset stats")
	}
}

func TestStart(t *testing.T) {
	s := NewStatistics(2*time.Second, false)
	s.AddStat("bytes", "devel", GaugeType, 10)
	stat, err := s.GetStat("bytes")
	if err != nil || stat.Value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %f", err, stat.Value)
	}

	time.Sleep(2 * time.Second)

	// Now the stats should have reset properly

	stat, err = s.GetStat("bytes")
	if stat != nil || err != ErrNoSuchStat {
		t.Fatalf("Failed to reset stats")
	}
}

func TestClose(t *testing.T) {
	s := NewStatistics(2*time.Second, true)

	s.AddStat("bytes", "devel", GaugeType, 10)
	stat, err := s.GetStat("bytes")
	if err != nil || stat.Value != 10 {
		t.Fatalf("Failed first get test, Err is: %v and value is = %f", err, stat.Value)
	}
	s.Close()
	time.Sleep(2 * time.Second)
	// Now the stats should NOT have reset
	s.GetStat("bytes")
	stat, err = s.GetStat("bytes")
	if stat.Value == -1 || err == ErrNoSuchStat {
		t.Fatalf("Failed to close goroutine")
	}
}
