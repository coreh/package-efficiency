package main

import (
	"time"

	cron "github.com/robfig/cron/v3"
)

func operation(value any) any {
	in := value.(map[string]any)
	sched, err := cron.ParseStandard(in["pattern"].(string))
	if err != nil {
		panic(err)
	}
	ms := int64(in["start"].(float64))
	t := time.UnixMilli(ms).UTC()
	n := int(in["count"].(float64))
	out := make([]time.Time, n)
	for i := range out {
		t = sched.Next(t)
		out[i] = t
	}
	return out
}
