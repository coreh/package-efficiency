package main

import (
	"bytes"
	"encoding/hex"
)

var newline = []byte{'\n'}

// Untimed, once per fixture: the hex string becomes a byte slice.
func prepare(value any) any {
	b, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any { return bytes.Count(value.([]byte), newline) }
