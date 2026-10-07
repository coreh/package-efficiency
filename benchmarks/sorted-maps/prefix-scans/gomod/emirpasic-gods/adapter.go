package main

import (
	"strings"

	"github.com/emirpasic/gods/trees/redblacktree"
)

func operation(value any) any {
	in := value.(map[string]any)
	t := redblacktree.NewWithStringComparator()
	for i, k := range in["keys"].([]any) {
		t.Put(k.(string), i)
	}
	lookups := in["lookups"].([]any)
	found := make([]any, len(lookups))
	for j, k := range lookups {
		if v, ok := t.Get(k.(string)); ok {
			found[j] = v
		}
	}
	prefixes := in["prefixes"].([]any)
	scans := make([][]int, len(prefixes))
	for j, p := range prefixes {
		prefix := p.(string)
		out := []int{}
		if node, _ := t.Ceiling(prefix); node != nil {
			it := t.IteratorAt(node)
			for ok := true; ok && strings.HasPrefix(it.Key().(string), prefix); ok = it.Next() {
				out = append(out, it.Value().(int))
			}
		}
		scans[j] = out
	}
	return []any{found, scans}
}
