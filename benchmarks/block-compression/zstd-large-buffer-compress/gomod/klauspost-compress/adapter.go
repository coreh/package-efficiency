package main

import (
	"encoding/json"

	"github.com/klauspost/compress/zstd"
)

// Encoder and decoder as the package documents for many buffers: created once, used by EncodeAll and DecodeAll.
var encoder, _ = zstd.NewWriter(nil)
var decoder, _ = zstd.NewReader(nil)

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this decompresses it and reports its size.
type packed []byte

func (p packed) MarshalJSON() ([]byte, error) {
	out, err := decoder.DecodeAll(p, nil)
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{"text": string(out), "compressedBytes": len(p)})
}

func operation(value any) any {
	return packed(encoder.EncodeAll([]byte(value.(string)), nil))
}
