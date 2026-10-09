package main

import (
	"encoding/json"

	"github.com/golang/protobuf/proto"
	"github.com/jhump/protoreflect/desc"
	"github.com/jhump/protoreflect/dynamic"
	"google.golang.org/protobuf/types/descriptorpb"
)

// The schema is built once at start-up, as a descriptor (no protoc, no generated code).
func field(name string, number int32, t descriptorpb.FieldDescriptorProto_Type, repeated bool, typeName string) *descriptorpb.FieldDescriptorProto {
	label := descriptorpb.FieldDescriptorProto_LABEL_OPTIONAL
	if repeated {
		label = descriptorpb.FieldDescriptorProto_LABEL_REPEATED
	}
	f := &descriptorpb.FieldDescriptorProto{Name: proto.String(name), Number: proto.Int32(number), Type: t.Enum(), Label: label.Enum()}
	if typeName != "" {
		f.TypeName = proto.String(typeName)
	}
	return f
}

var (
	tDouble  = descriptorpb.FieldDescriptorProto_TYPE_DOUBLE
	tString  = descriptorpb.FieldDescriptorProto_TYPE_STRING
	tInt32   = descriptorpb.FieldDescriptorProto_TYPE_INT32
	tBool    = descriptorpb.FieldDescriptorProto_TYPE_BOOL
	tMessage = descriptorpb.FieldDescriptorProto_TYPE_MESSAGE
)

var recordDesc, locationDesc, eventDesc = func() (*desc.MessageDescriptor, *desc.MessageDescriptor, *desc.MessageDescriptor) {
	fd, err := desc.CreateFileDescriptor(&descriptorpb.FileDescriptorProto{
		Name: proto.String("telemetry.proto"), Package: proto.String("bench"), Syntax: proto.String("proto3"),
		MessageType: []*descriptorpb.DescriptorProto{
			{Name: proto.String("Location"), Field: []*descriptorpb.FieldDescriptorProto{
				field("lat", 1, tDouble, false, ""), field("lon", 2, tDouble, false, ""), field("city", 3, tString, false, "")}},
			{Name: proto.String("Event"), Field: []*descriptorpb.FieldDescriptorProto{
				field("at", 1, tInt32, false, ""), field("kind", 2, tString, false, ""), field("value", 3, tDouble, false, "")}},
			{Name: proto.String("Record"), Field: []*descriptorpb.FieldDescriptorProto{
				field("id", 1, tInt32, false, ""), field("name", 2, tString, false, ""), field("active", 3, tBool, false, ""),
				field("score", 4, tDouble, false, ""), field("tags", 5, tString, true, ""), field("samples", 6, tInt32, true, ""),
				field("readings", 7, tDouble, true, ""), field("location", 8, tMessage, false, ".bench.Location"),
				field("events", 9, tMessage, true, ".bench.Event")}},
		},
	})
	if err != nil {
		panic(err)
	}
	return fd.FindMessage("bench.Record"), fd.FindMessage("bench.Location"), fd.FindMessage("bench.Event")
}()

func must(err error) {
	if err != nil {
		panic(err)
	}
}

// Not timed: runs once per fixture. Fills a dynamic message from the fixture's
// fields; the unknown field "trace" is not part of the schema and is not copied.
func prepare(value any) any {
	in := value.(map[string]any)
	r := dynamic.NewMessage(recordDesc)
	must(r.TrySetFieldByName("id", int32(in["id"].(float64))))
	must(r.TrySetFieldByName("name", in["name"].(string)))
	must(r.TrySetFieldByName("active", in["active"].(bool)))
	must(r.TrySetFieldByName("score", in["score"].(float64)))
	for _, t := range in["tags"].([]any) {
		must(r.TryAddRepeatedFieldByName("tags", t.(string)))
	}
	for _, s := range in["samples"].([]any) {
		must(r.TryAddRepeatedFieldByName("samples", int32(s.(float64))))
	}
	for _, x := range in["readings"].([]any) {
		must(r.TryAddRepeatedFieldByName("readings", x.(float64)))
	}
	l := in["location"].(map[string]any)
	loc := dynamic.NewMessage(locationDesc)
	must(loc.TrySetFieldByName("lat", l["lat"].(float64)))
	must(loc.TrySetFieldByName("lon", l["lon"].(float64)))
	must(loc.TrySetFieldByName("city", l["city"].(string)))
	must(r.TrySetFieldByName("location", loc))
	for _, e := range in["events"].([]any) {
		em := e.(map[string]any)
		ev := dynamic.NewMessage(eventDesc)
		must(ev.TrySetFieldByName("at", int32(em["at"].(float64))))
		must(ev.TrySetFieldByName("kind", em["kind"].(string)))
		must(ev.TrySetFieldByName("value", em["value"].(float64)))
		must(r.TryAddRepeatedFieldByName("events", ev))
	}
	return r
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work; this reports the schema's fields and the size of a second encode.
type decoded struct{ m *dynamic.Message }

func get(m *dynamic.Message, name string) any {
	v, err := m.TryGetFieldByName(name)
	must(err)
	return v
}

func (d decoded) MarshalJSON() ([]byte, error) {
	m := d.m
	loc := get(m, "location").(*dynamic.Message)
	events := []any{}
	for _, e := range get(m, "events").([]any) {
		em := e.(*dynamic.Message)
		events = append(events, map[string]any{"at": get(em, "at"), "kind": get(em, "kind"), "value": get(em, "value")})
	}
	list := func(name string) any {
		out := []any{}
		return append(out, get(m, name).([]any)...)
	}
	b, err := m.Marshal()
	must(err)
	rec := map[string]any{
		"id": get(m, "id"), "name": get(m, "name"), "active": get(m, "active"), "score": get(m, "score"),
		"tags": list("tags"), "samples": list("samples"), "readings": list("readings"),
		"location": map[string]any{"lat": get(loc, "lat"), "lon": get(loc, "lon"), "city": get(loc, "city")},
		"events":   events,
	}
	return json.Marshal(map[string]any{"decoded": rec, "encodedBytes": len(b)})
}

func operation(value any) any {
	b, err := value.(*dynamic.Message).Marshal()
	must(err)
	out := dynamic.NewMessage(recordDesc)
	must(out.Unmarshal(b))
	return decoded{out}
}
