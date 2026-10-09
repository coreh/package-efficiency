package main

import "github.com/tchap/go-patricia/v2/patricia"

func operation(value any) any {
	in := value.(map[string]any)
	t := patricia.NewTrie()
	for i, k := range in["keys"].([]any) {
		t.Insert(patricia.Prefix(k.(string)), i)
	}
	lookups := in["lookups"].([]any)
	found := make([]any, len(lookups))
	for j, k := range lookups {
		if v := t.Get(patricia.Prefix(k.(string))); v != nil {
			found[j] = v
		}
	}
	prefixes := in["prefixes"].([]any)
	scans := make([][]int, len(prefixes))
	for j, p := range prefixes {
		out := []int{}
		t.VisitSubtree(patricia.Prefix(p.(string)), func(_ patricia.Prefix, item patricia.Item) error { out = append(out, item.(int)); return nil })
		scans[j] = out
	}
	return []any{found, scans}
}
