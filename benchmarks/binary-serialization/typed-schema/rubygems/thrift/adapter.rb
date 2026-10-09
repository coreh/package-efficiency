require 'thrift'

# The schema, as the thrift compiler's Ruby output declares it: a Thrift::Struct
# per struct with a FIELDS table (id, type, name). Written by hand because the
# compiler is not installed.
class Location
  include Thrift::Struct, Thrift::Struct_Union
  FIELDS = {
    1 => { type: Thrift::Types::DOUBLE, name: 'lat' },
    2 => { type: Thrift::Types::DOUBLE, name: 'lon' },
    3 => { type: Thrift::Types::STRING, name: 'city' }
  }
  def struct_fields; FIELDS; end
  def validate; end
  ::Thrift::Struct.generate_accessors self
end

class Event
  include Thrift::Struct, Thrift::Struct_Union
  FIELDS = {
    1 => { type: Thrift::Types::I32, name: 'at' },
    2 => { type: Thrift::Types::STRING, name: 'kind' },
    3 => { type: Thrift::Types::DOUBLE, name: 'value' }
  }
  def struct_fields; FIELDS; end
  def validate; end
  ::Thrift::Struct.generate_accessors self
end

class Record
  include Thrift::Struct, Thrift::Struct_Union
  FIELDS = {
    1 => { type: Thrift::Types::I32, name: 'id' },
    2 => { type: Thrift::Types::STRING, name: 'name' },
    3 => { type: Thrift::Types::BOOL, name: 'active' },
    4 => { type: Thrift::Types::DOUBLE, name: 'score' },
    5 => { type: Thrift::Types::LIST, name: 'tags', element: { type: Thrift::Types::STRING } },
    6 => { type: Thrift::Types::LIST, name: 'samples', element: { type: Thrift::Types::I32 } },
    7 => { type: Thrift::Types::LIST, name: 'readings', element: { type: Thrift::Types::DOUBLE } },
    8 => { type: Thrift::Types::STRUCT, name: 'location', class: Location },
    9 => { type: Thrift::Types::LIST, name: 'events', element: { type: Thrift::Types::STRUCT, class: Event } }
  }
  def struct_fields; FIELDS; end
  def validate; end
  ::Thrift::Struct.generate_accessors self
end

SERIALIZER = Thrift::Serializer.new(Thrift::BinaryProtocolAcceleratedFactory.new)
DESERIALIZER = Thrift::Deserializer.new(Thrift::BinaryProtocolAcceleratedFactory.new)

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
  DESERIALIZER.deserialize(Record.new, SERIALIZER.serialize(record))
end

# Not timed: runs once per fixture for the verifier.
def describe(result)
  loc = result.location
  {
    decoded: {
      id: result.id, name: result.name, active: result.active, score: result.score,
      tags: result.tags, samples: result.samples, readings: result.readings,
      location: { lat: loc.lat, lon: loc.lon, city: loc.city },
      events: result.events.map { |e| { at: e.at, kind: e.kind, value: e.value } }
    },
    encodedBytes: SERIALIZER.serialize(result).bytesize
  }
end
