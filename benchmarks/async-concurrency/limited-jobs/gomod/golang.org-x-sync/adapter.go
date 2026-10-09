package main

import (
	"runtime"
	"sync/atomic"

	"golang.org/x/sync/errgroup"
)

type jobs struct {
	values []int
	limit  int
}

func prepare(value any) any {
	m := value.(map[string]any)
	raw := m["values"].([]any)
	values := make([]int, len(raw))
	for i, v := range raw {
		values[i] = int(v.(float64))
	}
	return jobs{values, int(m["limit"].(float64))}
}

func operation(value any) any {
	in := value.(jobs)
	results := make([]int, len(in.values))
	var group errgroup.Group
	// Go blocks while limit goroutines of the group are running.
	group.SetLimit(in.limit)
	var active, peak atomic.Int32
	for i, v := range in.values {
		group.Go(func() error {
			n := active.Add(1)
			for {
				p := peak.Load()
				if n <= p || peak.CompareAndSwap(p, n) {
					break
				}
			}
			runtime.Gosched()
			active.Add(-1)
			results[i] = v*2 + 1
			return nil
		})
	}
	if err := group.Wait(); err != nil {
		panic(err)
	}
	return map[string]any{"results": results, "peak": int(peak.Load())}
}
