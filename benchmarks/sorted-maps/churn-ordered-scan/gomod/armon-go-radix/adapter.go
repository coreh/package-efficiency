package main

import "github.com/armon/go-radix"

func operation(value any) any {
	in := value.(map[string]any)
	t := radix.New()
	for i, k := range in["keys"].([]any) {
		t.Insert(k.(string), i)
	}
	rem := in["removals"].([]any)
	removed := make([]bool, len(rem))
	for j, k := range rem {
		_, ok := t.Delete(k.(string))
		removed[j] = ok
	}
	ordered := make([]int, 0, t.Len())
	t.Walk(func(_ string, v interface{}) bool { ordered = append(ordered, v.(int)); return false })
	return []any{removed, ordered}
}
