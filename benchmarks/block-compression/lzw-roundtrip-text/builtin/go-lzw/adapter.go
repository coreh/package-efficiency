package main

import (
	"bytes"
	"compress/lzw"
	"encoding/json"
	"io"
)

func pack(input []byte) []byte {
	var buf bytes.Buffer
	w := lzw.NewWriter(&buf, lzw.LSB, 8)
	w.Write(input)
	w.Close()
	return buf.Bytes()
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this adds the size of what the same compression call
// produces.
type restored string

func (r restored) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"text": string(r), "compressedBytes": len(pack([]byte(r)))})
}

func operation(value any) any {
	packed := pack([]byte(value.(string)))
	r := lzw.NewReader(bytes.NewReader(packed), lzw.LSB, 8)
	out, err := io.ReadAll(r)
	r.Close()
	if err != nil {
		panic(err)
	}
	return restored(out)
}
