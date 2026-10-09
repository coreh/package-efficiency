package main

import "github.com/VividCortex/gohistogram"

func operation(value any) any {
	h := gohistogram.NewHistogram(5000)
	for _, v := range value.([]any) {
		h.Add(v.(float64))
	}
	return []any{h.Quantile(0.5), h.Quantile(0.9), h.Quantile(0.99), h.Quantile(0.999)}
}
