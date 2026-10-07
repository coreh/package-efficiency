package main

import (
	"context"

	"github.com/pkg/diff/edit"
	"github.com/pkg/diff/myers"
)

// The library diffs anything that implements myers.Pair.
type pair struct{ a, b []rune }

func (p pair) LenA() int           { return len(p.a) }
func (p pair) LenB() int           { return len(p.b) }
func (p pair) Equal(i, j int) bool { return p.a[i] == p.b[j] }

func operation(value any) any {
	in := value.(map[string]any)
	s := myers.Diff(context.Background(), pair{[]rune(in["a"].(string)), []rune(in["b"].(string))})
	out := make([][]any, 0, len(s.Ranges))
	for _, r := range s.Ranges {
		op := "="
		switch r.Op() {
		case edit.Del:
			op = "-"
		case edit.Ins:
			op = "+"
		}
		out = append(out, []any{op, r.Len()})
	}
	return out
}
