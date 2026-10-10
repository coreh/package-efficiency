package main

import (
	"crypto/sha1"
	"encoding/hex"
)

// Untimed, once per fixture: the hex string becomes a byte slice.
func prepare(value any) any {
	b, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any { return sha1.Sum(value.([]byte)) }
