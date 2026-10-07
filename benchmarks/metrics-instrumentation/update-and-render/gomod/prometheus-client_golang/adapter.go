package main

import (
	"bytes"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/common/expfmt"
)

func strs(list any) []string {
	items := list.([]any)
	out := make([]string, len(items))
	for i, v := range items {
		out[i] = v.(string)
	}
	return out
}

func operation(value any) any {
	spec := value.(map[string]any)
	registry := prometheus.NewRegistry()
	metrics := func(key string) []map[string]any {
		items := spec[key].([]any)
		out := make([]map[string]any, len(items))
		for i, v := range items {
			out[i] = v.(map[string]any)
		}
		return out
	}
	cs, gs, hs := metrics("counters"), metrics("gauges"), metrics("histograms")
	counters := make([]*prometheus.CounterVec, len(cs))
	for i, m := range cs {
		counters[i] = prometheus.NewCounterVec(prometheus.CounterOpts{Name: m["name"].(string), Help: m["help"].(string)}, strs(m["labels"]))
		registry.MustRegister(counters[i])
	}
	gauges := make([]*prometheus.GaugeVec, len(gs))
	for i, m := range gs {
		gauges[i] = prometheus.NewGaugeVec(prometheus.GaugeOpts{Name: m["name"].(string), Help: m["help"].(string)}, strs(m["labels"]))
		registry.MustRegister(gauges[i])
	}
	histograms := make([]*prometheus.HistogramVec, len(hs))
	for i, m := range hs {
		bounds := m["buckets"].([]any)
		buckets := make([]float64, len(bounds))
		for k, b := range bounds {
			buckets[k] = b.(float64)
		}
		histograms[i] = prometheus.NewHistogramVec(prometheus.HistogramOpts{Name: m["name"].(string), Help: m["help"].(string), Buckets: buckets}, strs(m["labels"]))
		registry.MustRegister(histograms[i])
	}
	for _, u := range spec["updates"].([]any) {
		update := u.([]any)
		op, index, amount := update[0].(string), int(update[1].(float64)), update[3].(float64)
		values := strs(update[2])
		switch op {
		case "inc":
			counters[index].WithLabelValues(values...).Add(amount)
		case "observe":
			histograms[index].WithLabelValues(values...).Observe(amount)
		case "set":
			gauges[index].WithLabelValues(values...).Set(amount)
		case "add":
			gauges[index].WithLabelValues(values...).Add(amount)
		default:
			gauges[index].WithLabelValues(values...).Sub(amount)
		}
	}
	families, err := registry.Gather()
	if err != nil {
		panic(err)
	}
	var out bytes.Buffer
	encoder := expfmt.NewEncoder(&out, expfmt.NewFormat(expfmt.TypeTextPlain))
	for _, family := range families {
		if err := encoder.Encode(family); err != nil {
			panic(err)
		}
	}
	return out.String()
}
