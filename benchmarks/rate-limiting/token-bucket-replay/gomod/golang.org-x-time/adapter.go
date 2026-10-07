package main

import (
	"time"

	"golang.org/x/time/rate"
)

var epoch = time.Unix(1_000_000, 0)

func operation(value any) any {
	in := value.(map[string]any)
	limit := rate.Limit(in["rate"].(float64))
	burst := int(in["burst"].(float64))
	keys := in["keys"].([]any)
	times := in["times"].([]any)
	limiters := map[string]*rate.Limiter{}
	out := make([]bool, len(keys))
	for i, k := range keys {
		key := k.(string)
		lim, ok := limiters[key]
		if !ok {
			lim = rate.NewLimiter(limit, burst)
			limiters[key] = lim
		}
		now := epoch.Add(time.Duration(times[i].(float64)) * time.Millisecond)
		out[i] = lim.AllowN(now, 1)
	}
	return out
}
