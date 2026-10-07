package main

import (
	"encoding/csv"
	"strings"
)

func operation(value any) any {
	rows := value.([]any)
	var out strings.Builder
	w := csv.NewWriter(&out)
	var record []string
	for _, r := range rows {
		fields := r.([]any)
		record = record[:0]
		for _, f := range fields {
			record = append(record, f.(string))
		}
		if err := w.Write(record); err != nil {
			panic(err)
		}
	}
	w.Flush()
	if err := w.Error(); err != nil {
		panic(err)
	}
	return out.String()
}
