package main

import (
	"unicode/utf8"

	"github.com/sergi/go-diff/diffmatchpatch"
)

var dmp = diffmatchpatch.New()

func operation(value any) any {
	in := value.(map[string]any)
	c1, c2, _ := dmp.DiffLinesToChars(in["a"].(string), in["b"].(string))
	diffs := dmp.DiffMain(c1, c2, false)
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
