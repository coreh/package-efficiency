package main

import (
	"encoding/json"

	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protodesc"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/descriptorpb"
	"google.golang.org/protobuf/types/dynamicpb"
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

var recordDesc, locationDesc, eventDesc = func() (protoreflect.MessageDescriptor, protoreflect.MessageDescriptor, protoreflect.MessageDescriptor) {
	fd, err := protodesc.NewFile(&descriptorpb.FileDescriptorProto{
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
	}, nil)
	if err != nil {
		panic(err)
	}
	m := fd.Messages()
	return m.ByName("Record"), m.ByName("Location"), m.ByName("Event")
}()

// Not timed: runs once per fixture. Fills a message from the fixture's fields;
// the unknown field "trace" is not part of the schema and is not copied.
func prepare(value any) any {
	in := value.(map[string]any)
	f := recordDesc.Fields()
	r := dynamicpb.NewMessage(recordDesc)
	r.Set(f.ByName("id"), protoreflect.ValueOfInt32(int32(in["id"].(float64))))
	r.Set(f.ByName("name"), protoreflect.ValueOfString(in["name"].(string)))
	r.Set(f.ByName("active"), protoreflect.ValueOfBool(in["active"].(bool)))
	r.Set(f.ByName("score"), protoreflect.ValueOfFloat64(in["score"].(float64)))
	tags := r.Mutable(f.ByName("tags")).List()
	for _, t := range in["tags"].([]any) {
		tags.Append(protoreflect.ValueOfString(t.(string)))
	}
	samples := r.Mutable(f.ByName("samples")).List()
	for _, s := range in["samples"].([]any) {
		samples.Append(protoreflect.ValueOfInt32(int32(s.(float64))))
	}
	readings := r.Mutable(f.ByName("readings")).List()
	for _, x := range in["readings"].([]any) {
		readings.Append(protoreflect.ValueOfFloat64(x.(float64)))
	}
	l := in["location"].(map[string]any)
	loc := dynamicpb.NewMessage(locationDesc)
	loc.Set(locationDesc.Fields().ByName("lat"), protoreflect.ValueOfFloat64(l["lat"].(float64)))
	loc.Set(locationDesc.Fields().ByName("lon"), protoreflect.ValueOfFloat64(l["lon"].(float64)))
	loc.Set(locationDesc.Fields().ByName("city"), protoreflect.ValueOfString(l["city"].(string)))
	r.Set(f.ByName("location"), protoreflect.ValueOfMessage(loc))
	events := r.Mutable(f.ByName("events")).List()
	for _, e := range in["events"].([]any) {
		em := e.(map[string]any)
		ev := dynamicpb.NewMessage(eventDesc)
		ev.Set(eventDesc.Fields().ByName("at"), protoreflect.ValueOfInt32(int32(em["at"].(float64))))
		ev.Set(eventDesc.Fields().ByName("kind"), protoreflect.ValueOfString(em["kind"].(string)))
		ev.Set(eventDesc.Fields().ByName("value"), protoreflect.ValueOfFloat64(em["value"].(float64)))
		events.Append(protoreflect.ValueOfMessage(ev))
	}
	return r
}

// Verifier only (not timed): the runner marshals each result once before any
// measured work; this reports the schema's fields and the size of a second encode.
type decoded struct{ m *dynamicpb.Message }

func (d decoded) MarshalJSON() ([]byte, error) {
	j, err := protojson.MarshalOptions{EmitUnpopulated: true}.Marshal(d.m)
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string]any{"decoded": json.RawMessage(j), "encodedBytes": proto.Size(d.m)})
}

func operation(value any) any {
	b, err := proto.Marshal(value.(*dynamicpb.Message))
	if err != nil {
		panic(err)
	}
	out := dynamicpb.NewMessage(recordDesc)
	if err := proto.Unmarshal(b, out); err != nil {
		panic(err)
	}
	return decoded{out}
}
