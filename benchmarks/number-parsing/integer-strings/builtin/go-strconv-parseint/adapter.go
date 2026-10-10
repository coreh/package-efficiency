package main

import "strconv"

func operation(value any) any {
	in := value.([]any)
	out := make([]int64, len(in))
	for i, s := range in {
		n, err := strconv.ParseInt(s.(string), 10, 64)
		if err != nil {
			panic(err)
		}
		out[i] = n
	}
	return out
}
