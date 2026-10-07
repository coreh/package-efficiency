package main

import (
	"encoding/json"

	"github.com/hashicorp/go-msgpack/v2/codec"
)

type Location struct {
	Lat  float64 `json:"lat"`
	Lon  float64 `json:"lon"`
	City string  `json:"city"`
}

type Event struct {
	At    int32   `json:"at"`
	Kind  string  `json:"kind"`
	Value float64 `json:"value"`
}

type Record struct {
	ID       int32     `json:"id"`
	Name     string    `json:"name"`
	Active   bool      `json:"active"`
	Score    float64   `json:"score"`
	Tags     []string  `json:"tags"`
	Samples  []int32   `json:"samples"`
	Readings []float64 `json:"readings"`
	Location Location  `json:"location"`
	Events   []Event   `json:"events"`
}

var handle = new(codec.MsgpackHandle)

func encode(r *Record) []byte {
	var b []byte
	if err := codec.NewEncoderBytes(&b, handle).Encode(r); err != nil {
		panic(err)
	}
	return b
}

// Not timed: runs once per fixture. Reads the fixture's schema fields into the
// struct; the unknown field "trace" is not part of it.
func prepare(value any) any {
	b, err := json.Marshal(value)
	if err != nil {
		panic(err)
	}
	r := &Record{}
	if err := json.Unmarshal(b, r); err != nil {
		panic(err)
	}
	return r
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work; this reports the size of a second encode.
type decoded struct{ r *Record }

func (d decoded) MarshalJSON() ([]byte, error) {
	r := *d.r
	if r.Tags == nil {
		r.Tags = []string{}
	}
	if r.Samples == nil {
		r.Samples = []int32{}
	}
	if r.Readings == nil {
		r.Readings = []float64{}
	}
	if r.Events == nil {
		r.Events = []Event{}
	}
	return json.Marshal(map[string]any{"decoded": r, "encodedBytes": len(encode(d.r))})
}

func operation(value any) any {
	out := &Record{}
	if err := codec.NewDecoderBytes(encode(value.(*Record)), handle).Decode(out); err != nil {
		panic(err)
	}
	return decoded{out}
}
