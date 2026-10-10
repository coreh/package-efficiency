package main

import (
	"github.com/btcsuite/snappy-go"
)

type packed struct {
	Compressed []byte `json:"compressed"`
	Text       string `json:"text"`
}

func operation(value any) any {
	compressed := snappy.Encode(nil, []byte(value.(string)))
	restored, err := snappy.Decode(nil, compressed)
	if err != nil {
		panic(err)
	}
	return packed{Compressed: compressed, Text: string(restored)}
}
