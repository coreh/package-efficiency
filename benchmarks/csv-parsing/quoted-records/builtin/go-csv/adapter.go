package main

import (
	"encoding/csv"
	"strings"
)

func operation(value any) any {
	rows, err := csv.NewReader(strings.NewReader(value.(string))).ReadAll()
	if err != nil {
		panic(err)
	}
	return rows
}
