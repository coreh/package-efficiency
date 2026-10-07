package main

import (
	"strings"

	"github.com/aryann/difflib"
)

func lines(s string) []string {
	l := strings.SplitAfter(s, "\n")
	return l[:len(l)-1]
}

func operation(value any) any {
	in := value.(map[string]any)
	out := make([][]any, 0, 8)
	for _, r := range difflib.Diff(lines(in["a"].(string)), lines(in["b"].(string))) {
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
