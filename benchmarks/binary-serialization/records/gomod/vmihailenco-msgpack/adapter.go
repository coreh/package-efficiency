package main

import (
	"encoding/json"

	"github.com/vmihailenco/msgpack"
)

func encode(value any) []byte {
	b, err := msgpack.Marshal(value)
	if err != nil {
		panic(err)
	}
	return b
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work, and this adds the size of a second encode.
type decoded struct{ value any }

func (d decoded) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]any{"decoded": d.value, "encodedBytes": len(encode(d.value))})
}

func operation(value any) any {
	var out any
	if err := msgpack.Unmarshal(encode(value), &out); err != nil {
		panic(err)
	}
	return decoded{out}
}
