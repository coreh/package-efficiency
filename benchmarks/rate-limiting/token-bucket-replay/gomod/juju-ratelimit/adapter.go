package main

import (
	"time"

	"github.com/juju/ratelimit"
)

// fakeClock is the ratelimit.Clock the package documents for tests.
type fakeClock struct{ now time.Time }

func (c *fakeClock) Now() time.Time        { return c.now }
func (c *fakeClock) Sleep(d time.Duration) { c.now = c.now.Add(d) }

var epoch = time.Unix(1_000_000, 0)

func operation(value any) any {
	in := value.(map[string]any)
	rate := in["rate"].(float64)
	burst := int64(in["burst"].(float64))
	keys := in["keys"].([]any)
	times := in["times"].([]any)
	clock := &fakeClock{now: epoch}
	buckets := map[string]*ratelimit.Bucket{}
	out := make([]bool, len(keys))
	for i, k := range keys {
		key := k.(string)
		clock.now = epoch.Add(time.Duration(times[i].(float64)) * time.Millisecond)
		b, ok := buckets[key]
		if !ok {
			b = ratelimit.NewBucketWithRateAndClock(rate, burst, clock)
			buckets[key] = b
		}
		out[i] = b.TakeAvailable(1) == 1
	}
	return out
}
