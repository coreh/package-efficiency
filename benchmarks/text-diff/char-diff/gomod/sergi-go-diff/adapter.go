package main

import (
	"unicode/utf8"

	"github.com/sergi/go-diff/diffmatchpatch"
)

var dmp = diffmatchpatch.New()

func operation(value any) any {
	in := value.(map[string]any)
	diffs := dmp.DiffMain(in["a"].(string), in["b"].(string), false)
	out := make([][]any, 0, len(diffs))
	for _, d := range diffs {
		op := "="
		if d.Type == diffmatchpatch.DiffDelete {
			op = "-"
		} else if d.Type == diffmatchpatch.DiffInsert {
			op = "+"
		}
		out = append(out, []any{op, utf8.RuneCountInString(d.Text)})
	}
	return out
}
