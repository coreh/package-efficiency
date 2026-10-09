package main

import (
	"context"
	"errors"

	"github.com/cenkalti/backoff/v5"
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
	ctx := context.Background()
	for i, it := range in.items {
		calls := 0
		job := func() (int, error) {
			calls++
			if calls <= it.failures {
				return 0, errors.New("failed")
			}
			return it.value*2 + 1, nil
		}
		var out *int
		v, err := backoff.Retry(ctx, job, backoff.WithBackOff(&backoff.ZeroBackOff{}), backoff.WithMaxTries(uint(in.attempts)))
		if err == nil {
			out = &v
		}
		results[i] = result{calls, out}
	}
	return results
}
