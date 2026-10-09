require 'bindata'

# The schema, declared once at load: little-endian integers and doubles, strings
# and lists each preceded by their length.
class Str < BinData::Record
  endian :little
  uint32 :len, value: -> { data.bytesize }
  string :data, read_length: :len
end

class Location < BinData::Record
  endian :little
  double :lat
  double :lon
  str :city
end

class Event < BinData::Record
  endian :little
  int32 :at
  str :kind
  double :amount
end

class Record < BinData::Record
  endian :little
  int32 :id
  str :name
  uint8 :active
  double :score
  uint32 :tags_len, value: -> { tags.length }
  array :tags, type: :str, initial_length: :tags_len
  uint32 :samples_len, value: -> { samples.length }
  array :samples, type: :int32, initial_length: :samples_len
  uint32 :readings_len, value: -> { readings.length }
  array :readings, type: :double, initial_length: :readings_len
  location :location
  uint32 :events_len, value: -> { events.length }
  array :events, type: :event, initial_length: :events_len
end

# Not timed: runs once per fixture. Fills a Record from the fixture's fields;
# the unknown field "trace" is not part of the schema and is not copied.
def prepare(value)
  loc = value['location']
  Record.new(
    id: value['id'], name: { data: value['name'] }, active: value['active'] ? 1 : 0, score: value['score'],
    tags: value['tags'].map { |t| { data: t } }, samples: value['samples'], readings: value['readings'],
    location: { lat: loc['lat'], lon: loc['lon'], city: { data: loc['city'] } },
    events: value['events'].map { |e| { at: e['at'], kind: { data: e['kind'] }, amount: e['value'] } }
  )
end

def operation(record)
  Record.read(record.to_binary_s)
end

def utf8(s)
  s.to_s.dup.force_encoding('UTF-8')
end

# Not timed: runs once per fixture for the verifier.
def describe(result)
  loc = result.location
  {
    decoded: {
      id: result.id.to_i, name: utf8(result.name.data), active: result.active == 1, score: result.score.to_f,
      tags: result.tags.map { |t| utf8(t.data) }, samples: result.samples.map(&:to_i), readings: result.readings.map(&:to_f),
      location: { lat: loc.lat.to_f, lon: loc.lon.to_f, city: utf8(loc.city.data) },
      events: result.events.map { |e| { at: e.at.to_i, kind: utf8(e.kind.data), value: e.amount.to_f } }
    },
    encodedBytes: result.to_binary_s.bytesize
  }
end
