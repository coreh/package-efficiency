package main

import (
	"encoding/asn1"
	"encoding/hex"
)

func walk(b []byte, out []int) []int {
	for len(b) > 0 {
		var rv asn1.RawValue
		rest, err := asn1.Unmarshal(b, &rv)
		if err != nil {
			panic(err)
		}
		out = append(out, rv.Class*100+rv.Tag)
		if rv.IsCompound {
			out = walk(rv.Bytes, out)
		}
		b = rest
	}
	return out
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	return walk(value.([]byte), nil)
}
