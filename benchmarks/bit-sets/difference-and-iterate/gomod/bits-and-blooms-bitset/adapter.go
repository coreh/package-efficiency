package main

import "github.com/bits-and-blooms/bitset"

func list(s *bitset.BitSet) []uint {
	out := make([]uint, 0, s.Count())
	for i, ok := s.NextSet(0); ok; i, ok = s.NextSet(i + 1) {
		out = append(out, i)
	}
	return out
}

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
	return [][]uint{list(a.Difference(b)), list(a.SymmetricDifference(b))}
}
