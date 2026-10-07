package main

import "sync"

type load struct{ threads, turns int }

func prepare(value any) any {
	m := value.(map[string]any)
	return load{int(m["threads"].(float64)), int(m["turns"].(float64))}
}

func operation(value any) any {
	in := value.(load)
	var lock sync.Mutex
	var counter uint64
	sums := make([]uint64, in.threads)
	var wg sync.WaitGroup
	wg.Add(in.threads)
	for n := 0; n < in.threads; n++ {
		go func(n int) {
			defer wg.Done()
			var mine uint64
			for i := 0; i < in.turns; i++ {
				lock.Lock()
				ticket := counter
				counter = ticket + 1
				lock.Unlock()
				mine += ticket
			}
			sums[n] = mine
		}(n)
	}
	wg.Wait()
	var sum uint64
	for _, s := range sums {
		sum += s
	}
	return map[string]any{"count": counter, "sum": sum}
}
