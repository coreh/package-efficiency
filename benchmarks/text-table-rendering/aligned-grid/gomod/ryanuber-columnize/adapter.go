package main

import (
	"fmt"
	"strings"

	"github.com/ryanuber/columnize"
)

func operation(value any) any {
	in := value.(map[string]any)
	line := func(cells []any) string {
		parts := make([]string, len(cells))
		for i, c := range cells {
			parts[i] = fmt.Sprint(c)
		}
		return strings.Join(parts, "|")
	}
	rows := in["rows"].([]any)
	lines := make([]string, 0, len(rows)+1)
	lines = append(lines, line(in["headers"].([]any)))
	for _, r := range rows {
		lines = append(lines, line(r.([]any)))
	}
	return columnize.SimpleFormat(lines)
}
