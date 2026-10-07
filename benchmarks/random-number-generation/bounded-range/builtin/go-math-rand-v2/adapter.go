package main

import "math/rand/v2"

func operation(value any) any {
	m := value.(map[string]any)
	seed := uint64(m["seed"].(float64))
	lo := int64(m["min"].(float64))
	span := int64(m["max"].(float64)) - lo + 1
	rng := rand.New(rand.NewPCG(seed, seed))
	out := make([]int64, int(m["count"].(float64)))
	for i := range out {
		out[i] = rng.Int64N(span) + lo
	}
	return out
}
