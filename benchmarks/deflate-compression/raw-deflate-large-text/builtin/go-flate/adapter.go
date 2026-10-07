package main

import (
	"bytes"
	"compress/flate"
)

func operation(value any) any {
	var buf bytes.Buffer
	w, _ := flate.NewWriter(&buf, flate.DefaultCompression)
	w.Write([]byte(value.(string)))
	w.Close()
	return buf.Bytes()
}
