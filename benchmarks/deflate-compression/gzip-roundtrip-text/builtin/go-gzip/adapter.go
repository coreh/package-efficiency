package main

import (
	"bytes"
	"compress/gzip"
	"io"
)

func operation(value any) any {
	var buf bytes.Buffer
	w := gzip.NewWriter(&buf)
	w.Write([]byte(value.(string)))
	w.Close()
	r, _ := gzip.NewReader(&buf)
	out, _ := io.ReadAll(r)
	return string(out)
}
