package main

import (
	"errors"

	"github.com/eapache/go-resiliency/retrier"
)

type item struct {
	value    int
	failures int
}

type input struct {
	items    []item
	attempts int
}

type result struct {
	Attempts int  `json:"attempts"`
	Value    *int `json:"value"`
}

func prepare(value any) any {
	m := value.(map[string]any)
	raw := m["items"].([]any)
	items := make([]item, len(raw))
	for i, r := range raw {
		o := r.(map[string]any)
		items[i] = item{int(o["value"].(float64)), int(o["failures"].(float64))}
	}
	return input{items, int(m["attempts"].(float64))}
}

func operation(value any) any {
	in := value.(input)
	results := make([]result, len(in.items))
	for i, it := range in.items {
		calls := 0
		var got int
		job := func() error {
			calls++
			if calls <= it.failures {
				return errors.New("failed")
			}
			got = it.value*2 + 1
			return nil
		}
		var out *int
		if err := retrier.New(retrier.ConstantBackoff(in.attempts-1, 0), nil).Run(job); err == nil {
			out = &got
		}
		results[i] = result{calls, out}
	}
	return results
}
