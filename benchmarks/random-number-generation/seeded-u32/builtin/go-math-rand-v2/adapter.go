package main

import "math/rand/v2"

func operation(value any) any {
	m := value.(map[string]any)
	seed := uint64(m["seed"].(float64))
	rng := rand.New(rand.NewPCG(seed, seed))
	out := make([]uint32, int(m["count"].(float64)))
	for i := range out {
		out[i] = rng.Uint32()
	}
	return out
}
