package main

import "github.com/influxdata/tdigest"

func operation(value any) any {
	t := tdigest.NewWithCompression(5000)
	for _, v := range value.([]any) {
		t.Add(v.(float64), 1)
	}
	return []any{t.Quantile(0.5), t.Quantile(0.9), t.Quantile(0.99), t.Quantile(0.999)}
}
