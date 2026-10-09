package main

import (
	"context"
	"runtime"
	"sync"
	"sync/atomic"

	"github.com/jackc/puddle/v2"
)

type load struct{ size, callers, cycles int }

type resource struct{ uses, sum int }

func prepare(value any) any {
	m := value.(map[string]any)
	return load{int(m["size"].(float64)), int(m["callers"].(float64)), int(m["cycles"].(float64))}
}

func operation(value any) any {
	in := value.(load)
	ctx := context.Background()
	pool, err := puddle.NewPool(&puddle.Config[*resource]{
		Constructor: func(context.Context) (*resource, error) { return &resource{}, nil },
		Destructor:  func(*resource) {},
		MaxSize:     int32(in.size),
	})
	if err != nil {
		panic(err)
	}
	var active, peak atomic.Int32
	var wg sync.WaitGroup
	wg.Add(in.callers)
	for c := 0; c < in.callers; c++ {
		go func(c int) {
			defer wg.Done()
			for j := 0; j < in.cycles; j++ {
				res, err := pool.Acquire(ctx)
				if err != nil {
					panic(err)
				}
				n := active.Add(1)
				for {
					p := peak.Load()
					if n <= p || peak.CompareAndSwap(p, n) {
						break
					}
				}
				r := res.Value()
				r.uses++
				r.sum += (c*31+j)%97 + 1
				runtime.Gosched()
				active.Add(-1)
				res.Release()
			}
		}(c)
	}
	wg.Wait()
	// Check out the whole pool at once: a resource never returned would block here.
	held := make([]*puddle.Resource[*resource], 0, in.size)
	for i := 0; i < in.size; i++ {
		res, err := pool.Acquire(ctx)
		if err != nil {
			panic(err)
		}
		held = append(held, res)
	}
	uses, sum := 0, 0
	for _, res := range held {
		uses += res.Value().uses
		sum += res.Value().sum
	}
	for _, res := range held {
		res.Release()
	}
	pool.Close()
	return map[string]any{"cycles": uses, "checksum": sum, "peak": int(peak.Load()), "drained": len(held)}
}
