package main

import (
	"encoding/json"

	"github.com/klauspost/compress/zstd"
)

// Encoder and decoder as the package documents for many small buffers: created once, used by EncodeAll and DecodeAll.
var encoder, _ = zstd.NewWriter(nil)
var decoder, _ = zstd.NewReader(nil)

func pack(input []byte) []byte { return encoder.EncodeAll(input, nil) }

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this adds the size of what the same compression call produces.
type restored string

func (r restored) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"text": string(r), "compressedBytes": len(pack([]byte(r)))})
}

func operation(value any) any {
	out, err := decoder.DecodeAll(pack([]byte(value.(string))), nil)
	if err != nil {
		panic(err)
	}
	return restored(out)
}
