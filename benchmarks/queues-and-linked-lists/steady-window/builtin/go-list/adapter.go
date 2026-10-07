package main

import "container/list"

func operation(value any) any {
	pair := value.([]any)
	window := int(pair[0].(float64))
	items := pair[1].([]any)
	queue := list.New()
	var out []any
	for _, item := range items {
		queue.PushBack(item)
		if queue.Len() > window {
			out = append(out, queue.Remove(queue.Front()))
		}
	}
	held := queue.Len()
	for queue.Len() > 0 {
		out = append(out, queue.Remove(queue.Front()))
	}
	out = append(out, held)
	return out
}
