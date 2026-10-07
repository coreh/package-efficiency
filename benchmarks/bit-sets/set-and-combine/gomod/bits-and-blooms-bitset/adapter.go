package main

import "github.com/bits-and-blooms/bitset"

func operation(value any) any {
	v := value.(map[string]any)
	size := uint(v["size"].(float64))
	a, b := bitset.New(size), bitset.New(size)
	for _, p := range v["a"].([]any) {
		a.Set(uint(p.(float64)))
	}
	for _, p := range v["b"].([]any) {
		b.Set(uint(p.(float64)))
	}
	return []int64{int64(a.Count()), int64(b.Count()), int64(a.Union(b).Count()), int64(a.Intersection(b).Count())}
}
