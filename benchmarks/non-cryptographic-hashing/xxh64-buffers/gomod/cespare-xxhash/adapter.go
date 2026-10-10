package main

import (
	"encoding/hex"
	"strconv"

	"github.com/cespare/xxhash/v2"
)

// The library's uint64, unchanged; the Go runner marshals each result once per
// fixture, outside timing, and this writes it as a quoted unsigned decimal
// because a JSON number above 2^53 would lose its low bits.
type hash64 uint64

func (h hash64) MarshalJSON() ([]byte, error) {
	return strconv.AppendQuote(nil, strconv.FormatUint(uint64(h), 10)), nil
}

// Untimed, once per fixture: the hex string becomes a byte slice.
func prepare(value any) any {
	b, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any { return hash64(xxhash.Sum64(value.([]byte))) }
