package main

import "container/list"

func operation(value any) any {
	items := value.([]any)
	dq := list.New()
	var out []any
	for _, item := range items {
		x := int64(item.(float64))
		switch x & 3 {
		case 0:
			dq.PushBack(item)
		case 1:
			dq.PushFront(item)
		case 2:
			if dq.Len() > 0 {
				out = append(out, dq.Remove(dq.Front()))
			}
		default:
			if dq.Len() > 0 {
				out = append(out, dq.Remove(dq.Back()))
			}
		}
	}
	out = append(out, -1)
	for dq.Len() > 0 {
		out = append(out, dq.Remove(dq.Front()))
	}
	return out
}
