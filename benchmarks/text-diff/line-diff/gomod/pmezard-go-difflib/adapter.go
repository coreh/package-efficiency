package main

import (
	"strings"

	"github.com/pmezard/go-difflib/difflib"
)

func lines(s string) []string {
	l := strings.SplitAfter(s, "\n")
	return l[:len(l)-1]
}

func operation(value any) any {
	in := value.(map[string]any)
	m := difflib.NewMatcher(lines(in["a"].(string)), lines(in["b"].(string)))
	out := make([][]any, 0, 8)
	for _, c := range m.GetOpCodes() {
		switch c.Tag {
		case 'e':
			out = append(out, []any{"=", c.I2 - c.I1})
		case 'd':
			out = append(out, []any{"-", c.I2 - c.I1})
		case 'i':
			out = append(out, []any{"+", c.J2 - c.J1})
		default:
			out = append(out, []any{"-", c.I2 - c.I1}, []any{"+", c.J2 - c.J1})
		}
	}
	return out
}
