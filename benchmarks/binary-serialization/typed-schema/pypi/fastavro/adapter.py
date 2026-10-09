import io
import fastavro

_schema = fastavro.parse_schema({
    'type': 'record', 'name': 'Record',
    'fields': [
        {'name': 'id', 'type': 'int'},
        {'name': 'name', 'type': 'string'},
        {'name': 'active', 'type': 'boolean'},
        {'name': 'score', 'type': 'double'},
        {'name': 'tags', 'type': {'type': 'array', 'items': 'string'}},
        {'name': 'samples', 'type': {'type': 'array', 'items': 'int'}},
        {'name': 'readings', 'type': {'type': 'array', 'items': 'double'}},
        {'name': 'location', 'type': {'type': 'record', 'name': 'Location', 'fields': [
            {'name': 'lat', 'type': 'double'}, {'name': 'lon', 'type': 'double'}, {'name': 'city', 'type': 'string'}]}},
        {'name': 'events', 'type': {'type': 'array', 'items': {'type': 'record', 'name': 'Event', 'fields': [
            {'name': 'at', 'type': 'int'}, {'name': 'kind', 'type': 'string'}, {'name': 'value', 'type': 'double'}]}}},
    ],
})

# Not timed: the fixture is a plain dict; the writer ignores the unknown field `trace`.
def operation(value):
    buf = io.BytesIO()
    fastavro.schemaless_writer(buf, _schema, value)
    buf.seek(0)
    return fastavro.schemaless_reader(buf, _schema)

# Not timed: runs once per fixture for the verifier.
def describe(result):
    buf = io.BytesIO()
    fastavro.schemaless_writer(buf, _schema, result)
    return {'decoded': result, 'encodedBytes': len(buf.getvalue())}
