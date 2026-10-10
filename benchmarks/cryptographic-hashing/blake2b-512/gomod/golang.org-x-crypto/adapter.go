package main

import (
	"encoding/hex"

	"golang.org/x/crypto/blake2b"
)

// Untimed, once per fixture: the hex string becomes a byte slice.
func prepare(value any) any {
	b, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any { return blake2b.Sum512(value.([]byte)) }
