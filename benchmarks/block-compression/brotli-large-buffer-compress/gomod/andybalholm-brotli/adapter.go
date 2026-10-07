package main

import (
	"bytes"
	"encoding/json"
	"io"

	"github.com/andybalholm/brotli"
)

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this decompresses it and reports its size.
type packed []byte

func (p packed) MarshalJSON() ([]byte, error) {
	out, err := io.ReadAll(brotli.NewReader(bytes.NewReader(p)))
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{"text": string(out), "compressedBytes": len(p)})
}

func operation(value any) any {
	var buf bytes.Buffer
	w := brotli.NewWriterLevel(&buf, 11)
	w.Write([]byte(value.(string)))
	w.Close()
	return packed(buf.Bytes())
}
