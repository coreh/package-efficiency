package main

import "github.com/armon/go-radix"

func operation(value any) any {
	in := value.(map[string]any)
	t := radix.New()
	for i, k := range in["keys"].([]any) {
		t.Insert(k.(string), i)
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
		out := []int{}
		t.WalkPrefix(p.(string), func(_ string, v interface{}) bool { out = append(out, v.(int)); return false })
		scans[j] = out
	}
	return []any{found, scans}
}
