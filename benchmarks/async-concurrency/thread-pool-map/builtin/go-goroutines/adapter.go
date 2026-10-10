package main

import "sync"

type jobs struct {
	threads int
	seeds   []uint32
	rounds  []int
}

func prepare(value any) any {
	m := value.(map[string]any)
	rawSeeds, rawRounds := m["seeds"].([]any), m["rounds"].([]any)
	seeds, rounds := make([]uint32, len(rawSeeds)), make([]int, len(rawRounds))
	for i := range rawSeeds {
		seeds[i] = uint32(rawSeeds[i].(float64))
		rounds[i] = int(rawRounds[i].(float64))
	}
	return jobs{int(m["threads"].(float64)), seeds, rounds}
}

func job(seed uint32, rounds int) uint32 {
	x := seed
	for r := 0; r < rounds; r++ {
		x ^= x << 13
		x ^= x >> 17
		x ^= x << 5
	}
	return x
}

func operation(value any) any {
	in := value.(jobs)
	results := make([]uint32, len(in.seeds))
	indices := make(chan int, len(in.seeds))
	for i := range in.seeds {
		indices <- i
	}
	close(indices)
	var wg sync.WaitGroup
	wg.Add(in.threads)
	for w := 0; w < in.threads; w++ {
		go func() {
			defer wg.Done()
			for i := range indices {
				results[i] = job(in.seeds[i], in.rounds[i])
			}
		}()
	}
	wg.Wait()
	return results
}
