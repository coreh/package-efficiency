package main

import "time"

// Not timed: runs once per fixture. The JSON list becomes a []string.
func prepare(value any) any {
	raw := value.([]any)
	texts := make([]string, len(raw))
	for i, t := range raw {
		texts[i] = t.(string)
	}
	return texts
}

func operation(value any) any {
	texts := value.([]string)
	out := make([]int64, len(texts))
	for i, t := range texts {
		d, err := time.ParseDuration(t)
		if err != nil {
			panic(err)
		}
		out[i] = int64(d / time.Second)
	}
	return out
}
