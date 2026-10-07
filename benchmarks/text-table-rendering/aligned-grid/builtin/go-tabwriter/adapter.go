package main

import (
	"fmt"
	"strings"
	"text/tabwriter"
)

func operation(value any) any {
	in := value.(map[string]any)
	var sb strings.Builder
	w := tabwriter.NewWriter(&sb, 0, 0, 2, ' ', 0)
	line := func(cells []any) {
		for i, c := range cells {
			if i > 0 {
				w.Write([]byte{'\t'})
			}
			switch v := c.(type) {
			case string:
				w.Write([]byte(v))
			default:
				fmt.Fprint(w, v)
			}
		}
		w.Write([]byte{'\n'})
	}
	line(in["headers"].([]any))
	for _, r := range in["rows"].([]any) {
		line(r.([]any))
	}
	w.Flush()
	return sb.String()
}
