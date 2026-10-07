package main

import "github.com/google/btree"

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
	rem := in["removals"].([]any)
	removed := make([]bool, len(rem))
	for j, k := range rem {
		_, ok := t.Delete(item{key: k.(string)})
		removed[j] = ok
	}
	ordered := make([]int, 0, t.Len())
	t.Ascend(func(it item) bool { ordered = append(ordered, it.val); return true })
	return []any{removed, ordered}
}
