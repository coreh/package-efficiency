package main

import (
	"bytes"
	"encoding/hex"

	"github.com/xuri/excelize/v2"
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
	f, err := excelize.OpenReader(bytes.NewReader(value.([]byte)))
	if err != nil {
		panic(err)
	}
	defer f.Close()
	names := f.GetSheetList()
	out := make([]sheet, 0, len(names))
	for _, name := range names {
		rows, err := f.GetRows(name, excelize.Options{RawCellValue: true})
		if err != nil {
			panic(err)
		}
		out = append(out, sheet{Name: name, Rows: rows})
	}
	return out
}
