package main

import "maps"

func operation(value any) any {
	in := value.(map[string]any)
	keep := map[int]bool{}
	for _, n := range in["keep"].([]any) {
		keep[int(n.(float64))] = true
	}
	m := maps.Clone(in["entries"].(map[string]any))
	kept := []map[string]any{}
	if keep[0] {
		kept = append(kept, m)
	}
	for i, o := range in["ops"].([]any) {
		op := o.([]any)
		m = maps.Clone(m)
		if op[0].(string) == "set" {
			m[op[1].(string)] = op[2]
		} else {
			delete(m, op[1].(string))
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
			values[i] = v[k.(string)]
		}
		out[j] = []any{len(v), values}
	}
	return out
}
