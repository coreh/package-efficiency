package main

import (
	"fmt"
	"strings"

	"github.com/olekukonko/tablewriter"
)

func operation(value any) any {
	in := value.(map[string]any)
	var sb strings.Builder
	t := tablewriter.NewTable(&sb)
	h := in["headers"].([]any)
	hs := make([]string, len(h))
	for i, c := range h {
		hs[i] = fmt.Sprint(c)
	}
	t.Header(hs)
	for _, r := range in["rows"].([]any) {
		cells := r.([]any)
		row := make([]string, len(cells))
		for i, c := range cells {
			row[i] = fmt.Sprint(c)
		}
		if err := t.Append(row); err != nil {
			panic(err)
		}
	}
	if err := t.Render(); err != nil {
		panic(err)
	}
	return sb.String()
}
