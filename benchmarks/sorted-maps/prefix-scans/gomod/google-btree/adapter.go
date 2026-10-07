package main

import (
	"strings"

	"github.com/google/btree"
)

type item struct {
	key string
	val int
}

func operation(value any) any {
	in := value.(map[string]any)
	t := btree.NewG(32, func(a, b item) bool { return a.key < b.key })
	for i, k := range in["keys"].([]any) {
		t.ReplaceOrInsert(item{k.(string), i})
	}
	lookups := in["lookups"].([]any)
	found := make([]any, len(lookups))
	for j, k := range lookups {
		if it, ok := t.Get(item{key: k.(string)}); ok {
			found[j] = it.val
		}
	}
	prefixes := in["prefixes"].([]any)
	scans := make([][]int, len(prefixes))
	for j, p := range prefixes {
		prefix := p.(string)
		out := []int{}
		t.AscendGreaterOrEqual(item{key: prefix}, func(it item) bool {
			if !strings.HasPrefix(it.key, prefix) {
				return false
			}
			out = append(out, it.val)
			return true
		})
		scans[j] = out
	}
	return []any{found, scans}
}
