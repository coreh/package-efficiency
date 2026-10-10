package main

import (
	"bytes"
	"encoding/hex"
	"image"

	"golang.org/x/image/webp"
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
	img, err := webp.Decode(bytes.NewReader(value.([]byte)))
	if err != nil {
		panic(err)
	}
	b := img.Bounds()
	switch m := img.(type) {
	case *image.NRGBA:
		return decoded{Width: b.Dx(), Height: b.Dy(), Data: m.Pix}
	case *image.RGBA:
		return decoded{Width: b.Dx(), Height: b.Dy(), Data: m.Pix}
	}
	panic("unexpected image type")
}
