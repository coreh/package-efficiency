package main

import (
	"runtime"
	"sync"
)

type spawn struct {
	tasks, multiplier, offset, modulus int
}

func prepare(value any) any {
	m := value.(map[string]any)
	return spawn{int(m["tasks"].(float64)), int(m["multiplier"].(float64)), int(m["offset"].(float64)), int(m["modulus"].(float64))}
}

func operation(value any) any {
	in := value.(spawn)
	// Go has no join handle: each goroutine writes its value at its index,
	// and the WaitGroup is the join.
	values := make([]int, in.tasks)
	var wg sync.WaitGroup
	wg.Add(in.tasks)
	for i := 0; i < in.tasks; i++ {
		go func(i int) {
			defer wg.Done()
			runtime.Gosched()
			values[i] = (i*in.multiplier + in.offset) % in.modulus
		}(i)
	}
	wg.Wait()
	total := 0
	for _, v := range values {
		total += v
	}
	return total
}
