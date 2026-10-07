package main

import (
	"bytes"

	"github.com/tealeg/xlsx/v3"
)

func operation(value any) any {
	f := xlsx.NewFile()
	for _, s := range value.(map[string]any)["sheets"].([]any) {
		sheet := s.(map[string]any)
		ws, err := f.AddSheet(sheet["name"].(string))
		if err != nil {
			panic(err)
		}
		for _, r := range sheet["rows"].([]any) {
			row := ws.AddRow()
			for _, c := range r.([]any) {
				cell := row.AddCell()
				switch v := c.(type) {
				case string:
					cell.SetString(v)
				case float64:
					cell.SetFloat(v)
				}
			}
		}
	}
	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		panic(err)
	}
	return buf.Bytes()
}
