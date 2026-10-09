package main

import "github.com/tchap/go-patricia/v2/patricia"

func operation(value any) any {
	in := value.(map[string]any)
	t := patricia.NewTrie()
	for i, k := range in["keys"].([]any) {
		t.Insert(patricia.Prefix(k.(string)), i)
	}
	rem := in["removals"].([]any)
	removed := make([]bool, len(rem))
	for j, k := range rem {
		removed[j] = t.Delete(patricia.Prefix(k.(string)))
	}
	ordered := []int{}
	t.Visit(func(_ patricia.Prefix, item patricia.Item) error { ordered = append(ordered, item.(int)); return nil })
	return []any{removed, ordered}
}
