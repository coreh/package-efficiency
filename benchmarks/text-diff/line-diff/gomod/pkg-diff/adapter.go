package main

import (
	"context"
	"strings"

	"github.com/pkg/diff/edit"
	"github.com/pkg/diff/myers"
)

// The library diffs anything that implements myers.Pair.
type pair struct{ a, b []string }

func (p pair) LenA() int           { return len(p.a) }
func (p pair) LenB() int           { return len(p.b) }
func (p pair) Equal(i, j int) bool { return p.a[i] == p.b[j] }

func lines(s string) []string {
	l := strings.SplitAfter(s, "\n")
	return l[:len(l)-1]
}

func operation(value any) any {
	in := value.(map[string]any)
	s := myers.Diff(context.Background(), pair{lines(in["a"].(string)), lines(in["b"].(string))})
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
