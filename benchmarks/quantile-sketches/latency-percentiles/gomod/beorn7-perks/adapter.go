package main

import "github.com/beorn7/perks/quantile"

func operation(value any) any {
	s := quantile.NewTargeted(map[float64]float64{0.5: 0.0001, 0.9: 0.0001, 0.99: 0.0001, 0.999: 0.0001})
	for _, v := range value.([]any) {
		s.Insert(v.(float64))
	}
	return []any{s.Query(0.5), s.Query(0.9), s.Query(0.99), s.Query(0.999)}
}
