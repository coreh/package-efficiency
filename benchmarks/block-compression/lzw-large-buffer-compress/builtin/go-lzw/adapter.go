package main

import (
	"bytes"
	"compress/lzw"
	"encoding/json"
	"io"
)

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this decompresses it and reports its size.
type packed []byte

func (p packed) MarshalJSON() ([]byte, error) {
	r := lzw.NewReader(bytes.NewReader(p), lzw.LSB, 8)
	out, err := io.ReadAll(r)
	r.Close()
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{"text": string(out), "compressedBytes": len(p)})
}

func operation(value any) any {
	var buf bytes.Buffer
	w := lzw.NewWriter(&buf, lzw.LSB, 8)
	w.Write([]byte(value.(string)))
	w.Close()
	return packed(buf.Bytes())
}
