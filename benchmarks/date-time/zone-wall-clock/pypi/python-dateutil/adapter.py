from datetime import datetime
from dateutil import tz

# Untimed, once per fixture: the zone is looked up by name.
def prepare(value):
    return (tz.gettz(value["zone"]), value["instants"])

def operation(value):
    zone, instants = value
    out = []
    for t in instants:
        d = datetime.fromtimestamp(t, tz=zone)
        out.append([d.strftime("%Y-%m-%dT%H:%M:%S"), int(d.utcoffset().total_seconds())])
    return out
