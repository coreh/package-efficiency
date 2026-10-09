package main

import (
	"github.com/aryann/difflib"
)

func chars(s string) []string {
	out := make([]string, 0, len(s))
	for _, r := range s {
		out = append(out, string(r))
	}
	return out
}

func operation(value any) any {
	in := value.(map[string]any)
	out := make([][]any, 0, 8)
	for _, r := range difflib.Diff(chars(in["a"].(string)), chars(in["b"].(string))) {
		op := "="
		if r.Delta == difflib.LeftOnly {
			op = "-"
		} else if r.Delta == difflib.RightOnly {
			op = "+"
		}
		if n := len(out); n > 0 && out[n-1][0] == op {
			out[n-1][1] = out[n-1][1].(int) + 1
		} else {
			out = append(out, []any{op, 1})
		}
	}
	return out
}
