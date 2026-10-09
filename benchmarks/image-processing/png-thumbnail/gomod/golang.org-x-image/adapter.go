package main

import (
	"bytes"
	"encoding/hex"
	"image"
	"image/png"

	xdraw "golang.org/x/image/draw"
)

type job struct {
	data          []byte
	width, height int
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	m := value.(map[string]any)
	raw, err := hex.DecodeString(m["png"].(string))
	if err != nil {
		panic(err)
	}
	return job{raw, int(m["width"].(float64)), int(m["height"].(float64))}
}

func operation(value any) any {
	j := value.(job)
	src, err := png.Decode(bytes.NewReader(j.data))
	if err != nil {
		panic(err)
	}
	dst := image.NewRGBA(image.Rect(0, 0, j.width, j.height))
	xdraw.CatmullRom.Scale(dst, dst.Bounds(), src, src.Bounds(), xdraw.Src, nil)
	var out bytes.Buffer
	if err := png.Encode(&out, dst); err != nil {
		panic(err)
	}
	return out.Bytes()
}
