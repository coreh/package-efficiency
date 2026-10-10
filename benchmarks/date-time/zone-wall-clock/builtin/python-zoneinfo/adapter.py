from datetime import datetime
from zoneinfo import ZoneInfo

# Untimed, once per fixture: the zone is looked up by name.
def prepare(value):
    return (ZoneInfo(value["zone"]), value["instants"])

def operation(value):
    zone, instants = value
    out = []
    for t in instants:
        d = datetime.fromtimestamp(t, zone)
        out.append([d.strftime("%Y-%m-%dT%H:%M:%S"), int(d.utcoffset().total_seconds())])
    return out
