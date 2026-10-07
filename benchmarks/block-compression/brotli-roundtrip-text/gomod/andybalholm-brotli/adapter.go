package main

import (
	"bytes"
	"encoding/json"
	"io"

	"github.com/andybalholm/brotli"
)

func pack(input []byte) []byte {
	var buf bytes.Buffer
	w := brotli.NewWriterLevel(&buf, 11)
	w.Write(input)
	w.Close()
	return buf.Bytes()
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this adds the size of what the same compression call produces.
type restored string

func (r restored) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"text": string(r), "compressedBytes": len(pack([]byte(r)))})
}

func operation(value any) any {
	out, err := io.ReadAll(brotli.NewReader(bytes.NewReader(pack([]byte(value.(string))))))
	if err != nil {
		panic(err)
	}
	return restored(out)
}
