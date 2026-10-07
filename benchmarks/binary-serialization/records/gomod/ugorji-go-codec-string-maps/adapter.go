package main

import (
	"encoding/json"
	"reflect"

	"github.com/ugorji/go/codec"
)

var handle = func() *codec.MsgpackHandle {
	h := new(codec.MsgpackHandle)
	h.MapType = reflect.TypeOf(map[string]any(nil))
	h.RawToString = true
	return h
}()

func encode(value any) []byte {
	var b []byte
	if err := codec.NewEncoderBytes(&b, handle).Encode(value); err != nil {
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
	if err := codec.NewDecoderBytes(encode(value), handle).Decode(&out); err != nil {
		panic(err)
	}
	return decoded{out}
}
