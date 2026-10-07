package main

import (
	"image/color"

	"github.com/boombuler/barcode/qr"
)

var levels = []qr.ErrorCorrectionLevel{qr.L, qr.M, qr.Q, qr.H}

func operation(value any) any {
	m := value.(map[string]any)
	code, err := qr.Encode(m["text"].(string), levels[int(m["level"].(float64))], qr.Auto)
	if err != nil {
		panic(err)
	}
	size := code.Bounds().Dx()
	out := make([][]bool, size)
	for y := 0; y < size; y++ {
		row := make([]bool, size)
		for x := 0; x < size; x++ {
			row[x] = code.At(x, y) == color.Black
		}
		out[y] = row
	}
	return out
}
