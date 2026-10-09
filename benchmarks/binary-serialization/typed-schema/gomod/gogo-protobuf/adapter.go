package main

import (
	"encoding/json"

	"github.com/gogo/protobuf/proto"
)

// Message structs as protoc-gen-go (gogo flavour) writes them, without a .proto file or protoc:
// field numbers and wire types are in the struct tags, which proto.Marshal reads by reflection.
type Location struct {
	Lat  float64 `protobuf:"fixed64,1,opt,name=lat,proto3" json:"lat"`
	Lon  float64 `protobuf:"fixed64,2,opt,name=lon,proto3" json:"lon"`
	City string  `protobuf:"bytes,3,opt,name=city,proto3" json:"city"`
}

func (m *Location) Reset()         { *m = Location{} }
func (m *Location) String() string { return proto.CompactTextString(m) }
func (*Location) ProtoMessage()    {}

type Event struct {
	At    int32   `protobuf:"varint,1,opt,name=at,proto3" json:"at"`
	Kind  string  `protobuf:"bytes,2,opt,name=kind,proto3" json:"kind"`
	Value float64 `protobuf:"fixed64,3,opt,name=value,proto3" json:"value"`
}

func (m *Event) Reset()         { *m = Event{} }
func (m *Event) String() string { return proto.CompactTextString(m) }
func (*Event) ProtoMessage()    {}

type Record struct {
	ID       int32     `protobuf:"varint,1,opt,name=id,proto3" json:"id"`
	Name     string    `protobuf:"bytes,2,opt,name=name,proto3" json:"name"`
	Active   bool      `protobuf:"varint,3,opt,name=active,proto3" json:"active"`
	Score    float64   `protobuf:"fixed64,4,opt,name=score,proto3" json:"score"`
	Tags     []string  `protobuf:"bytes,5,rep,name=tags,proto3" json:"tags"`
	Samples  []int32   `protobuf:"varint,6,rep,packed,name=samples,proto3" json:"samples"`
	Readings []float64 `protobuf:"fixed64,7,rep,packed,name=readings,proto3" json:"readings"`
	Location *Location `protobuf:"bytes,8,opt,name=location,proto3" json:"location"`
	Events   []*Event  `protobuf:"bytes,9,rep,name=events,proto3" json:"events"`
}

func (m *Record) Reset()         { *m = Record{} }
func (m *Record) String() string { return proto.CompactTextString(m) }
func (*Record) ProtoMessage()    {}

func encode(r *Record) []byte {
	b, err := proto.Marshal(r)
	if err != nil {
		panic(err)
	}
	return b
}

// Not timed: runs once per fixture. Reads the fixture's schema fields into the
// message; the unknown field "trace" is not part of it.
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
		r.Events = []*Event{}
	}
	if r.Location == nil {
		r.Location = &Location{}
	}
	return json.Marshal(map[string]any{"decoded": r, "encodedBytes": len(encode(d.r))})
}

func operation(value any) any {
	out := &Record{}
	if err := proto.Unmarshal(encode(value.(*Record)), out); err != nil {
		panic(err)
	}
	return decoded{out}
}
