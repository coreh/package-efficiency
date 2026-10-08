import base64
import datetime
import plistlib

# Not timed: runs once per fixture. plistlib reads bytes.
def prepare(value):
    return value.encode('utf-8')

def operation(data):
    return plistlib.loads(data)

# Not timed: runs once per fixture. Dates and data get the task's common shape.
def describe(value):
    if isinstance(value, dict):
        return {k: describe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [describe(v) for v in value]
    if isinstance(value, (bytes, bytearray)):
        return {'$data': base64.b64encode(value).decode('ascii')}
    if isinstance(value, datetime.datetime):
        if value.tzinfo is not None:
            value = value.astimezone(datetime.timezone.utc)
        return {'$date': value.strftime('%Y-%m-%dT%H:%M:%SZ')}
    return value
