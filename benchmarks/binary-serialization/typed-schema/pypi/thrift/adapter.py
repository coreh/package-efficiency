from typing import Any
from thrift.Thrift import TType
from thrift.protocol.TBinaryProtocol import TBinaryProtocolAcceleratedFactory
from thrift.TSerialization import serialize, deserialize

# The schema, as the thrift compiler's output declares it: a class per struct with
# a thrift_spec (field id, type, name, type arguments, default) and the fast-path
# read/write that generated code starts with (the accelerated binary protocol,
# the extension in the wheel, walks thrift_spec). Written by hand because the
# compiler is not installed.
class _Struct:
    thrift_spec: Any = ()

    def read(self, iprot: Any) -> None:
        iprot._fast_decode(self, iprot, [self.__class__, self.thrift_spec])

    def write(self, oprot: Any) -> None:
        oprot.trans.write(oprot._fast_encode(self, [self.__class__, self.thrift_spec]))

class Location(_Struct):
    def __init__(self, lat: Any = None, lon: Any = None, city: Any = None) -> None:
        self.lat, self.lon, self.city = lat, lon, city

class Event(_Struct):
    def __init__(self, at: Any = None, kind: Any = None, value: Any = None) -> None:
        self.at, self.kind, self.value = at, kind, value

class Record(_Struct):
    def __init__(self, id: Any = None, name: Any = None, active: Any = None, score: Any = None, tags: Any = None,
                 samples: Any = None, readings: Any = None, location: Any = None, events: Any = None) -> None:
        self.id, self.name, self.active, self.score = id, name, active, score
        self.tags, self.samples, self.readings = tags, samples, readings
        self.location, self.events = location, events

Location.thrift_spec = (
    None,
    (1, TType.DOUBLE, 'lat', None, None),
    (2, TType.DOUBLE, 'lon', None, None),
    (3, TType.STRING, 'city', 'UTF8', None),
)
Event.thrift_spec = (
    None,
    (1, TType.I32, 'at', None, None),
    (2, TType.STRING, 'kind', 'UTF8', None),
    (3, TType.DOUBLE, 'value', None, None),
)
Record.thrift_spec = (
    None,
    (1, TType.I32, 'id', None, None),
    (2, TType.STRING, 'name', 'UTF8', None),
    (3, TType.BOOL, 'active', None, None),
    (4, TType.DOUBLE, 'score', None, None),
    (5, TType.LIST, 'tags', (TType.STRING, 'UTF8', False), None),
    (6, TType.LIST, 'samples', (TType.I32, None, False), None),
    (7, TType.LIST, 'readings', (TType.DOUBLE, None, False), None),
    (8, TType.STRUCT, 'location', [Location, Location.thrift_spec], None),
    (9, TType.LIST, 'events', (TType.STRUCT, [Event, Event.thrift_spec], False), None),
)

_factory = TBinaryProtocolAcceleratedFactory()

# Not timed: runs once per fixture. Fills the struct from the fixture's fields;
# the unknown field `trace` is not part of the schema and is not copied.
def prepare(value: Any) -> Record:
    loc = value['location']
    return Record(
        value['id'], value['name'], value['active'], value['score'],
        value['tags'], value['samples'], value['readings'],
        Location(loc['lat'], loc['lon'], loc['city']),
        [Event(e['at'], e['kind'], e['value']) for e in value['events']],
    )

def operation(record: Record) -> Any:
    return deserialize(Record(), serialize(record, protocol_factory=_factory), protocol_factory=_factory)

# Not timed: runs once per fixture for the verifier.
def describe(result: Any) -> Any:
    loc = result.location
    return {
        'decoded': {
            'id': result.id, 'name': result.name, 'active': result.active, 'score': result.score,
            'tags': result.tags, 'samples': result.samples, 'readings': result.readings,
            'location': {'lat': loc.lat, 'lon': loc.lon, 'city': loc.city},
            'events': [{'at': e.at, 'kind': e.kind, 'value': e.value} for e in result.events],
        },
        'encodedBytes': len(serialize(result, protocol_factory=_factory)),
    }
