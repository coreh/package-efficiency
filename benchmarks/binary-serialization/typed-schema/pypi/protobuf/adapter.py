from google.protobuf import descriptor_pb2, descriptor_pool, message_factory

# The schema is built once at import, as a descriptor (no protoc, no generated code).
_T = descriptor_pb2.FieldDescriptorProto
_file = descriptor_pb2.FileDescriptorProto(name='telemetry.proto', package='bench', syntax='proto3')

def _message(name, fields):
    m = _file.message_type.add(name=name)
    for number, (fname, ftype, label, type_name) in enumerate(fields, 1):
        f = m.field.add(name=fname, number=number, type=ftype, label=label)
        if type_name:
            f.type_name = type_name

_O, _R = _T.LABEL_OPTIONAL, _T.LABEL_REPEATED
_message('Location', [('lat', _T.TYPE_DOUBLE, _O, None), ('lon', _T.TYPE_DOUBLE, _O, None), ('city', _T.TYPE_STRING, _O, None)])
_message('Event', [('at', _T.TYPE_INT32, _O, None), ('kind', _T.TYPE_STRING, _O, None), ('value', _T.TYPE_DOUBLE, _O, None)])
_message('Record', [
    ('id', _T.TYPE_INT32, _O, None), ('name', _T.TYPE_STRING, _O, None), ('active', _T.TYPE_BOOL, _O, None),
    ('score', _T.TYPE_DOUBLE, _O, None), ('tags', _T.TYPE_STRING, _R, None), ('samples', _T.TYPE_INT32, _R, None),
    ('readings', _T.TYPE_DOUBLE, _R, None), ('location', _T.TYPE_MESSAGE, _O, '.bench.Location'),
    ('events', _T.TYPE_MESSAGE, _R, '.bench.Event'),
])
_pool = descriptor_pool.DescriptorPool()
_pool.Add(_file)
Record = message_factory.GetMessageClass(_pool.FindMessageTypeByName('bench.Record'))

# Not timed: runs once per fixture. Fills a Record from the fixture's fields;
# the unknown field `trace` is not part of the schema and is not copied.
def prepare(value):
    r = Record(id=value['id'], name=value['name'], active=value['active'], score=value['score'])
    r.tags.extend(value['tags'])
    r.samples.extend(value['samples'])
    r.readings.extend(value['readings'])
    loc = value['location']
    r.location.lat, r.location.lon, r.location.city = loc['lat'], loc['lon'], loc['city']
    for e in value['events']:
        r.events.add(at=e['at'], kind=e['kind'], value=e['value'])
    return r

def operation(record):
    out = Record()
    out.ParseFromString(record.SerializeToString())
    return out

# Not timed: runs once per fixture for the verifier.
def describe(result):
    loc = result.location
    return {
        'decoded': {
            'id': result.id, 'name': result.name, 'active': result.active, 'score': result.score,
            'tags': list(result.tags), 'samples': list(result.samples), 'readings': list(result.readings),
            'location': {'lat': loc.lat, 'lon': loc.lon, 'city': loc.city},
            'events': [{'at': e.at, 'kind': e.kind, 'value': e.value} for e in result.events],
        },
        'encodedBytes': len(result.SerializeToString()),
    }
