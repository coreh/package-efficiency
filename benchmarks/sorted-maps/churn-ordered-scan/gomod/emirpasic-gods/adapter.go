package main

import "github.com/emirpasic/gods/maps/treemap"

func operation(value any) any {
	in := value.(map[string]any)
	m := treemap.NewWithStringComparator()
	for i, k := range in["keys"].([]any) {
		m.Put(k.(string), i)
	}
	rem := in["removals"].([]any)
	removed := make([]bool, len(rem))
	for j, k := range rem {
		key := k.(string)
		if _, ok := m.Get(key); ok {
			m.Remove(key)
			removed[j] = true
		}
	}
	vals := m.Values()
	ordered := make([]int, len(vals))
	for i, v := range vals {
		ordered[i] = v.(int)
	}
	return []any{removed, ordered}
}
