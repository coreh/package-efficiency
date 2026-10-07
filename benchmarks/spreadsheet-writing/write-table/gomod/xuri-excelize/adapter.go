package main

import "github.com/xuri/excelize/v2"

func operation(value any) any {
	f := excelize.NewFile()
	defer f.Close()
	for i, s := range value.(map[string]any)["sheets"].([]any) {
		sheet := s.(map[string]any)
		name := sheet["name"].(string)
		if i == 0 {
			f.SetSheetName("Sheet1", name)
		} else {
			f.NewSheet(name)
		}
		for y, r := range sheet["rows"].([]any) {
			row := r.([]any)
			cell, _ := excelize.CoordinatesToCellName(1, y+1)
			if err := f.SetSheetRow(name, cell, &row); err != nil {
				panic(err)
			}
		}
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		panic(err)
	}
	return buf.Bytes()
}
