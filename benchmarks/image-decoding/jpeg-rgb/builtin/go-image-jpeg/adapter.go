package main

import (
	"bytes"
	"encoding/hex"
	"image"
	"image/draw"
	"image/jpeg"
)

type decoded struct {
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Data   []byte `json:"data"`
}

// Untimed, once per fixture: the hex string becomes the file's bytes.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	img, err := jpeg.Decode(bytes.NewReader(value.([]byte)))
	if err != nil {
		panic(err)
	}
	// jpeg.Decode returns the planes as an *image.YCbCr; draw.Draw converts them to RGBA
	// with the standard library's YCbCr-to-RGB conversion.
	b := img.Bounds()
	rgba := image.NewRGBA(b)
	draw.Draw(rgba, b, img, b.Min, draw.Src)
	return decoded{Width: b.Dx(), Height: b.Dy(), Data: rgba.Pix}
}
