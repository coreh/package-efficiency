package main

import (
	"sort"

	"github.com/coreos/go-semver/semver"
)

func operation(value any) any {
	in := value.([]any)
	parsed := make([]*semver.Version, len(in))
	for i, v := range in {
		parsed[i] = semver.New(v.(string))
	}
	order := make([]int, len(in))
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool { return parsed[order[a]].LessThan(*parsed[order[b]]) })
	out := make([]string, len(in))
	for i, k := range order {
		out[i] = in[k].(string)
	}
	return out
}
