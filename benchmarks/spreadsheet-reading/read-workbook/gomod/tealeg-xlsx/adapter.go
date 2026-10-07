package main

import (
	"encoding/hex"

	"github.com/tealeg/xlsx/v3"
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
	book, err := xlsx.OpenBinary(value.([]byte))
	if err != nil {
		panic(err)
	}
	out := make([]sheet, 0, len(book.Sheets))
	for _, sh := range book.Sheets {
		rows := make([][]string, 0, sh.MaxRow)
		err := sh.ForEachRow(func(r *xlsx.Row) error {
			cells := make([]string, 0, sh.MaxCol)
			err := r.ForEachCell(func(c *xlsx.Cell) error {
				cells = append(cells, c.Value)
				return nil
			})
			rows = append(rows, cells)
			return err
		})
		if err != nil {
			panic(err)
		}
		out = append(out, sheet{Name: sh.Name, Rows: rows})
	}
	return out
}
