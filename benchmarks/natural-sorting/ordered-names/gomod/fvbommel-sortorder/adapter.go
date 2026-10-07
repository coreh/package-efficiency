package main

import (
	"sort"

	"github.com/fvbommel/sortorder"
)

func prepare(value any) any {
	in := value.([]any)
	out := make([]string, len(in))
	for i, s := range in {
		out[i] = s.(string)
	}
	return out
}

func operation(value any) any {
	in := value.([]string)
	out := make([]string, len(in))
	copy(out, in)
	sort.Sort(sortorder.Natural(out))
	return out
}
