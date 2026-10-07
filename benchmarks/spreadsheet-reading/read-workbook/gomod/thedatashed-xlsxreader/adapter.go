package main

import (
	"encoding/hex"

	"github.com/thedatashed/xlsxreader"
)

type sheet struct {
	Name string     `json:"name"`
	Rows [][]string `json:"rows"`
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	book, err := xlsxreader.NewReader(value.([]byte))
	if err != nil {
		panic(err)
	}
	out := make([]sheet, 0, len(book.Sheets))
	for _, name := range book.Sheets {
		var rows [][]string
		for row := range book.ReadRows(name) {
			if row.Error != nil {
				panic(row.Error)
			}
			cells := make([]string, len(row.Cells))
			for i, c := range row.Cells {
				cells[i] = c.Value
			}
			rows = append(rows, cells)
		}
		out = append(out, sheet{Name: name, Rows: rows})
	}
	return out
}
