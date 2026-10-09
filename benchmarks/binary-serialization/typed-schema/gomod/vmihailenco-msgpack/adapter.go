package main

import (
	"encoding/json"

	"github.com/vmihailenco/msgpack"
)

type Location struct {
	Lat  float64 `json:"lat" msgpack:"lat"`
	Lon  float64 `json:"lon" msgpack:"lon"`
	City string  `json:"city" msgpack:"city"`
}

type Event struct {
	At    int32   `json:"at" msgpack:"at"`
	Kind  string  `json:"kind" msgpack:"kind"`
	Value float64 `json:"value" msgpack:"value"`
}

type Record struct {
	ID       int32     `json:"id" msgpack:"id"`
	Name     string    `json:"name" msgpack:"name"`
	Active   bool      `json:"active" msgpack:"active"`
	Score    float64   `json:"score" msgpack:"score"`
	Tags     []string  `json:"tags" msgpack:"tags"`
	Samples  []int32   `json:"samples" msgpack:"samples"`
	Readings []float64 `json:"readings" msgpack:"readings"`
	Location Location  `json:"location" msgpack:"location"`
	Events   []Event   `json:"events" msgpack:"events"`
}

func encode(r *Record) []byte {
	b, err := msgpack.Marshal(r)
	if err != nil {
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
	if err := msgpack.Unmarshal(encode(value.(*Record)), out); err != nil {
		panic(err)
	}
	return decoded{out}
}
