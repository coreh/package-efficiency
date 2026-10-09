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
type restored string

func (r restored) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"text": string(r), "compressedBytes": len(pack([]byte(r)))})
}

func operation(value any) any {
	out, err := zstd.Decompress(nil, pack([]byte(value.(string))))
	if err != nil {
		panic(err)
	}
	return restored(out)
}
