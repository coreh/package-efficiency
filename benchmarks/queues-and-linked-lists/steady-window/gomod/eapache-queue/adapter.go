package main

import "github.com/eapache/queue"

func operation(value any) any {
	pair := value.([]any)
	window := int(pair[0].(float64))
	items := pair[1].([]any)
	q := queue.New()
	var out []any
	for _, item := range items {
		q.Add(item)
		if q.Length() > window {
			out = append(out, q.Remove())
		}
	}
	held := q.Length()
	for q.Length() > 0 {
		out = append(out, q.Remove())
	}
	out = append(out, held)
	return out
}
