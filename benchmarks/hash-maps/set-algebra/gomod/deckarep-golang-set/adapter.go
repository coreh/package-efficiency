package main

import mapset "github.com/deckarep/golang-set/v2"

func operation(value any) any {
	v := value.(map[string]any)
	ra := v["a"].([]any)
	rb := v["b"].([]any)
	a := make([]int, len(ra))
	for i, x := range ra {
		a[i] = int(x.(float64))
	}
	b := make([]int, len(rb))
	for i, x := range rb {
		b[i] = int(x.(float64))
	}
	sa := mapset.NewSet[int](a...)
	sb := mapset.NewSet[int](b...)
	return []mapset.Set[int]{sa.Union(sb), sa.Intersect(sb), sa.Difference(sb)}
}
