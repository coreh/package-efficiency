package main

import "github.com/lann/ps"

func operation(value any) any {
	in := value.(map[string]any)
	keep := map[int]bool{}
	for _, n := range in["keep"].([]any) {
		keep[int(n.(float64))] = true
	}
	m := ps.NewMap()
	for k, v := range in["entries"].(map[string]any) {
		m = m.Set(k, v)
	}
	kept := []ps.Map{}
	if keep[0] {
		kept = append(kept, m)
	}
	for i, o := range in["ops"].([]any) {
		op := o.([]any)
		if op[0].(string) == "set" {
			m = m.Set(op[1].(string), op[2])
		} else {
			m = m.Delete(op[1].(string))
		}
		if keep[i+1] {
			kept = append(kept, m)
		}
	}
	lookups := in["lookups"].([]any)
	out := make([]any, len(kept))
	for j, v := range kept {
		values := make([]any, len(lookups))
		for i, k := range lookups {
			if x, ok := v.Lookup(k.(string)); ok {
				values[i] = x
			}
		}
		out[j] = []any{v.Size(), values}
	}
	return out
}
