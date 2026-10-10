package main

import (
	"encoding/hex"

	"lukechampine.com/blake3"
)

// Untimed, once per fixture: the hex string becomes a byte slice.
func prepare(value any) any {
	b, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any { return blake3.Sum256(value.([]byte)) }
