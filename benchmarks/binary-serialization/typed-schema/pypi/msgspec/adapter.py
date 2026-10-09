import msgspec

class Location(msgspec.Struct):
    lat: float
    lon: float
    city: str

class Event(msgspec.Struct):
    at: int
    kind: str
    value: float

class Record(msgspec.Struct):
    id: int
    name: str
    active: bool
    score: float
    tags: list[str]
    samples: list[int]
    readings: list[float]
    location: Location
    events: list[Event]

_encode = msgspec.msgpack.Encoder().encode
_decode = msgspec.msgpack.Decoder(Record).decode

# Not timed: runs once per fixture. Builds the typed struct from the fixture's
# fields; the unknown field `trace` is not part of the schema and is not copied.
def prepare(value):
    loc = value['location']
    return Record(
        id=value['id'], name=value['name'], active=value['active'], score=value['score'],
        tags=value['tags'], samples=value['samples'], readings=value['readings'],
        location=Location(loc['lat'], loc['lon'], loc['city']),
        events=[Event(e['at'], e['kind'], e['value']) for e in value['events']],
    )

def operation(record):
    return _decode(_encode(record))

# Not timed: runs once per fixture for the verifier.
def describe(result):
    return {'decoded': msgspec.to_builtins(result), 'encodedBytes': len(_encode(result))}
