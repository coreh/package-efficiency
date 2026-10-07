package main

import (
	"sort"

	"github.com/blang/semver/v4"
)

func operation(value any) any {
	in := value.([]any)
	parsed := make([]semver.Version, len(in))
	for i, v := range in {
		p, err := semver.Parse(v.(string))
		if err != nil {
			panic(err)
		}
		parsed[i] = p
	}
	order := make([]int, len(in))
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool { return parsed[order[a]].LT(parsed[order[b]]) })
	out := make([]string, len(in))
	for i, k := range order {
		out[i] = in[k].(string)
	}
	return out
}
