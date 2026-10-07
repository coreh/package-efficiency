require 'google/protobuf'
require 'google/protobuf/descriptor_pb'

# The schema is built once at load, as a descriptor (no protoc, no generated code).
def field(name, number, type, repeated = false, type_name = nil)
  Google::Protobuf::FieldDescriptorProto.new(
    name: name, number: number, type: type,
    label: repeated ? :LABEL_REPEATED : :LABEL_OPTIONAL, type_name: type_name
  )
end

def message(name, fields)
  Google::Protobuf::DescriptorProto.new(name: name, field: fields.each_with_index.map { |f, i| field(f[0], i + 1, *f[1..]) })
end

FILE = Google::Protobuf::FileDescriptorProto.new(
  name: 'telemetry.proto', package: 'bench', syntax: 'proto3',
  message_type: [
    message('Location', [['lat', :TYPE_DOUBLE], ['lon', :TYPE_DOUBLE], ['city', :TYPE_STRING]]),
    message('Event', [['at', :TYPE_INT32], ['kind', :TYPE_STRING], ['value', :TYPE_DOUBLE]]),
    message('Record', [
      ['id', :TYPE_INT32], ['name', :TYPE_STRING], ['active', :TYPE_BOOL], ['score', :TYPE_DOUBLE],
      ['tags', :TYPE_STRING, true], ['samples', :TYPE_INT32, true], ['readings', :TYPE_DOUBLE, true],
      ['location', :TYPE_MESSAGE, false, '.bench.Location'], ['events', :TYPE_MESSAGE, true, '.bench.Event']
    ])
  ]
)
POOL = Google::Protobuf::DescriptorPool.generated_pool
POOL.add_serialized_file(Google::Protobuf::FileDescriptorProto.encode(FILE))
Record = POOL.lookup('bench.Record').msgclass
Location = POOL.lookup('bench.Location').msgclass
Event = POOL.lookup('bench.Event').msgclass

# Not timed: runs once per fixture. Fills a Record from the fixture's fields;
# the unknown field "trace" is not part of the schema and is not copied.
def prepare(value)
  loc = value['location']
  Record.new(
    id: value['id'], name: value['name'], active: value['active'], score: value['score'],
    tags: value['tags'], samples: value['samples'], readings: value['readings'],
    location: Location.new(lat: loc['lat'], lon: loc['lon'], city: loc['city']),
    events: value['events'].map { |e| Event.new(at: e['at'], kind: e['kind'], value: e['value']) }
  )
end

def operation(record)
  Record.decode(Record.encode(record))
end

# Not timed: runs once per fixture for the verifier.
def describe(result)
  loc = result.location
  {
    decoded: {
      id: result.id, name: result.name, active: result.active, score: result.score,
      tags: result.tags.to_a, samples: result.samples.to_a, readings: result.readings.to_a,
      location: { lat: loc.lat, lon: loc.lon, city: loc.city },
      events: result.events.map { |e| { at: e.at, kind: e.kind, value: e.value } }
    },
    encodedBytes: Record.encode(result).bytesize
  }
end
