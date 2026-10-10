package main

import (
	"bytes"
	"encoding/json"
	"io"

	"github.com/ulikunitz/xz"
)

// Verifier only (not timed): marshals the bytes as a binary string
// (one character U+0000 to U+00FF per byte), not as base64.
type binary []byte

func (b binary) MarshalJSON() ([]byte, error) {
	r := make([]rune, len(b))
	for i, c := range b {
		r[i] = rune(c)
	}
	return json.Marshal(string(r))
}

// Untimed, once per fixture: one byte per character of the binary string.
func prepare(value any) any {
	s := value.(string)
	out := make([]byte, 0, len(s))
	for _, r := range s {
		out = append(out, byte(r))
	}
	return out
}

func operation(value any) any {
	b := value.([]byte)
	r, err := xz.NewReader(bytes.NewReader(b))
	if err != nil {
		panic(err)
	}
	out, err := io.ReadAll(r)
	if err != nil {
		panic(err)
	}
	return binary(out)
}
