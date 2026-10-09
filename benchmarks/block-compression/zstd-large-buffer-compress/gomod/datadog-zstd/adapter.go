package main

import (
	"encoding/json"

	"github.com/DataDog/zstd"
)

// Level 3 as the task fixes it (the package default, DefaultCompression, is 5).
func pack(input []byte) []byte {
	out, err := zstd.CompressLevel(nil, input, 3)
	if err != nil {
		panic(err)
	}
	return out
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work.
type packed []byte

func (p packed) MarshalJSON() ([]byte, error) {
	out, err := zstd.Decompress(nil, p)
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{"text": string(out), "compressedBytes": len(p)})
}

func operation(value any) any {
	return packed(pack([]byte(value.(string))))
}
