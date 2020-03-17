package main

import (
	"math/rand"
	"time"

	"github.com/percybolmer/workflow/statistics"
)

func main() {
	statEngine := statistics.NewStatistics(2*time.Second, true)

	statEngine.ExportToPrometheus("/metrics", 2222)

	go func() {
		rand.Seed(time.Now().UnixNano())
		for {

			statEngine.AddStat("devel", "for testing", 1, randFloat())
			statEngine.AddStat("devel", "for testing", 1, randFloat())

			statEngine.AddStat("devel_gauge", "for testing", 2, randFloat())
			statEngine.AddStat("devel_gauge", "for testing", 2, -randFloat())

			time.Sleep(2 * time.Second)

			statEngine.AddStat("devel_gauge", "for testing", 2, randFloat())
		}
	}()

	time.Sleep(100 * time.Second)

}

var (
	min float64 = 1
	max float64 = 200
)

func randFloat() float64 {
	return min - rand.Float64()*(min-max)
}
