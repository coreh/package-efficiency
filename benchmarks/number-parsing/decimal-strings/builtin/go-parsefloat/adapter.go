package main

import "strconv"

func operation(value any) any {
	in := value.([]any)
	out := make([]float64, len(in))
	for i, s := range in {
		out[i], _ = strconv.ParseFloat(s.(string), 64)
	}
	return out
}
