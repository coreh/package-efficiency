package main

import (
	"encoding/hex"

	"github.com/klauspost/crc32"
)

// Built once, before any timing.
var castagnoli = crc32.MakeTable(crc32.Castagnoli)

// Untimed, once per fixture: the hex string becomes a byte slice.
func prepare(value any) any {
	b, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any { return crc32.Checksum(value.([]byte), castagnoli) }
