package main

import (
	"encoding/binary"
	"encoding/json"

	"github.com/pierrec/lz4/v4"
)

// LZ4 block with the uncompressed length in front as four bytes, like the other LZ4 entries that do so.
func pack(input []byte) []byte {
	dst := make([]byte, 4+lz4.CompressBlockBound(len(input)))
	binary.LittleEndian.PutUint32(dst, uint32(len(input)))
	var c lz4.Compressor
	n, err := c.CompressBlock(input, dst[4:])
	if err != nil {
		panic(err)
	}
	if n == 0 {
		// Incompressible input: CompressBlock reports it by returning 0, and the block is then written as literals only.
		n = copyLiterals(dst[4:], input)
	}
	return dst[:4+n]
}

// A block made of one sequence with literals only: token, extra length bytes, literals.
func copyLiterals(dst, src []byte) int {
	i := 0
	l := len(src)
	if l < 15 {
		dst[i] = byte(l << 4)
		i++
	} else {
		dst[i] = 15 << 4
		i++
		for r := l - 15; ; r -= 255 {
			if r < 255 {
				dst[i] = byte(r)
				i++
				break
			}
			dst[i] = 255
			i++
		}
	}
	return i + copy(dst[i:], src)
}

func unpack(p []byte) []byte {
	out := make([]byte, binary.LittleEndian.Uint32(p))
	n, err := lz4.UncompressBlock(p[4:], out)
	if err != nil {
		panic(err)
	}
	return out[:n]
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this adds the size of what the same compression call produces.
type restored string

func (r restored) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"text": string(r), "compressedBytes": len(pack([]byte(r)))})
}

func operation(value any) any {
	return restored(unpack(pack([]byte(value.(string)))))
}
