package main

import "sync"

type load struct {
	producers, messages uint64
	capacity            int
}

func prepare(value any) any {
	m := value.(map[string]any)
	return load{uint64(m["producers"].(float64)), uint64(m["messages"].(float64)), int(m["capacity"].(float64))}
}

func operation(value any) any {
	in := value.(load)
	channel := make(chan uint64, in.capacity)
	var wg sync.WaitGroup
	wg.Add(int(in.producers))
	for p := uint64(0); p < in.producers; p++ {
		go func(p uint64) {
			defer wg.Done()
			for i := uint64(0); i < in.messages; i++ {
				channel <- i*in.producers + p
			}
		}(p)
	}
	next := make([]uint64, in.producers)
	var count, sum uint64
	ordered := true
	for n := in.producers * in.messages; count < n; count++ {
		v := <-channel
		p := v % in.producers
		if v/in.producers != next[p] {
			ordered = false
		}
		next[p]++
		sum += v
	}
	wg.Wait()
	return map[string]any{"count": count, "sum": sum, "ordered": ordered}
}
