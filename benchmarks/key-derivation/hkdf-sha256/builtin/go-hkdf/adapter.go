package main

import (
	"crypto/hkdf"
	"crypto/sha256"
	"encoding/hex"
)

type hkdfInput struct {
	ikm, salt []byte
	info      string
	length    int
}

func mustHex(s string) []byte {
	b, err := hex.DecodeString(s)
	if err != nil {
		panic(err)
	}
	return b
}

// Untimed, once per fixture: the hex strings become bytes (info a string, as hkdf.Key takes it).
func prepare(value any) any {
	m := value.(map[string]any)
	return hkdfInput{ikm: mustHex(m["ikm"].(string)), salt: mustHex(m["salt"].(string)), info: string(mustHex(m["info"].(string))), length: int(m["length"].(float64))}
}

// The []byte result is marshalled as base64 by encoding/json, outside the timed call.
func operation(value any) any {
	in := value.(hkdfInput)
	key, err := hkdf.Key(sha256.New, in.ikm, in.salt, in.info, in.length)
	if err != nil {
		panic(err)
	}
	return key
}
