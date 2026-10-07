package main

import (
	"bytes"
	"io"

	gzip "github.com/klauspost/pgzip"
)

func operation(value any) any {
	var buf bytes.Buffer
	w := gzip.NewWriter(&buf)
	if _, err := w.Write([]byte(value.(string))); err != nil {
		panic(err)
	}
	if err := w.Close(); err != nil {
		panic(err)
	}
	r, err := gzip.NewReader(&buf)
	if err != nil {
		panic(err)
	}
	out, err := io.ReadAll(r)
	if err != nil {
		panic(err)
	}
	r.Close()
	return string(out)
}
