package main

import iradix "github.com/hashicorp/go-immutable-radix"

func operation(value any) any {
	in := value.(map[string]any)
	keep := map[int]bool{}
	for _, n := range in["keep"].([]any) {
		keep[int(n.(float64))] = true
	}
	txn := iradix.New().Txn()
	for k, v := range in["entries"].(map[string]any) {
		txn.Insert([]byte(k), v)
	}
	t := txn.Commit()
	kept := []*iradix.Tree{}
	if keep[0] {
		kept = append(kept, t)
	}
	for i, o := range in["ops"].([]any) {
		op := o.([]any)
		if op[0].(string) == "set" {
			t, _, _ = t.Insert([]byte(op[1].(string)), op[2])
		} else {
			t, _, _ = t.Delete([]byte(op[1].(string)))
		}
		if keep[i+1] {
			kept = append(kept, t)
		}
	}
	lookups := in["lookups"].([]any)
	out := make([]any, len(kept))
	for j, v := range kept {
		values := make([]any, len(lookups))
		for i, k := range lookups {
			if x, ok := v.Get([]byte(k.(string))); ok {
				values[i] = x
			}
		}
		out[j] = []any{v.Len(), values}
	}
	return out
}
