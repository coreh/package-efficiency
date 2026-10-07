package main

import "github.com/HdrHistogram/hdrhistogram-go"

func operation(value any) any {
	h := hdrhistogram.New(1, 9000000000, 2)
	for _, v := range value.([]any) {
		if err := h.RecordValue(int64(v.(float64))); err != nil {
			panic(err)
		}
	}
	return []any{float64(h.ValueAtQuantile(50)), float64(h.ValueAtQuantile(90)), float64(h.ValueAtQuantile(99)), float64(h.ValueAtQuantile(99.9))}
}
