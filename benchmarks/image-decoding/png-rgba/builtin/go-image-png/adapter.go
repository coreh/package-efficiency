package main

import (
	"bytes"
	"encoding/hex"
	"image"
	"image/png"
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
	img, err := png.Decode(bytes.NewReader(value.([]byte)))
	if err != nil {
		panic(err)
	}
	nrgba := img.(*image.NRGBA)
	b := nrgba.Bounds()
	return decoded{Width: b.Dx(), Height: b.Dy(), Data: nrgba.Pix}
}
