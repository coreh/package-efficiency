package main

import (
	"runtime"
	"sync"
	"sync/atomic"
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
	// A buffered channel as a counting semaphore: a send takes a place and
	// blocks while all are taken.
	places := make(chan struct{}, in.limit)
	var wg sync.WaitGroup
	var active, peak atomic.Int32
	wg.Add(len(in.values))
	for i, v := range in.values {
		places <- struct{}{}
		go func(i, v int) {
			defer wg.Done()
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
			<-places
		}(i, v)
	}
	wg.Wait()
	return map[string]any{"results": results, "peak": int(peak.Load())}
}
