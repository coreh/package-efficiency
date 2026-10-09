package main

import (
	"encoding/binary"
	"encoding/json"

	lz4 "github.com/cloudflare/golz4"
)

// LZ4 block (lz4.c fast compressor) with the uncompressed length in front as four bytes, like the other LZ4 entries that do so;
// golz4's Uncompress needs an output buffer of the right size.
func pack(input []byte) []byte {
	out := make([]byte, 4+lz4.CompressBound(input))
	binary.LittleEndian.PutUint32(out, uint32(len(input)))
	n, err := lz4.Compress(input, out[4:])
	if err != nil {
		panic(err)
	}
	return out[:4+n]
}

func unpack(p []byte) []byte {
	out := make([]byte, binary.LittleEndian.Uint32(p))
	if err := lz4.Uncompress(p[4:], out); err != nil {
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
	return restored(unpack(pack([]byte(value.(string)))))
}
