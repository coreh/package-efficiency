package main

import (
	"runtime"
	"sync"
	"sync/atomic"
)

type load struct{ size, callers, cycles int }

type resource struct{ uses, sum int }

func prepare(value any) any {
	m := value.(map[string]any)
	return load{int(m["size"].(float64)), int(m["callers"].(float64)), int(m["cycles"].(float64))}
}

func operation(value any) any {
	in := value.(load)
	pool := make(chan *resource, in.size)
	for i := 0; i < in.size; i++ {
		pool <- &resource{}
	}
	var active, peak atomic.Int32
	var wg sync.WaitGroup
	wg.Add(in.callers)
	for c := 0; c < in.callers; c++ {
		go func(c int) {
			defer wg.Done()
			for j := 0; j < in.cycles; j++ {
				r := <-pool
				n := active.Add(1)
				for {
					p := peak.Load()
					if n <= p || peak.CompareAndSwap(p, n) {
						break
					}
				}
				r.uses++
				r.sum += (c*31+j)%97 + 1
				runtime.Gosched()
				active.Add(-1)
				pool <- r
			}
		}(c)
	}
	wg.Wait()
	// Check out the whole pool at once: a resource never returned would block here.
	held := make([]*resource, 0, in.size)
	for i := 0; i < in.size; i++ {
		held = append(held, <-pool)
	}
	uses, sum := 0, 0
	for _, r := range held {
		uses += r.uses
		sum += r.sum
	}
	return map[string]any{"cycles": uses, "checksum": sum, "peak": int(peak.Load()), "drained": len(held)}
}
