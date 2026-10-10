package main

import (
	"encoding/hex"
	"hash/crc32"
)

// Built once, before any timing: the Castagnoli table (on arm64 and amd64
// MakeTable also selects the hardware CRC-32C instructions).
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
