import arrow
from dateutil import tz

# Untimed, once per fixture: the zone is looked up by name.
def prepare(value):
    return (tz.gettz(value["zone"]), value["instants"])

def operation(value):
    zone, instants = value
    out = []
    for t in instants:
        d = arrow.get(t).to(zone)
        out.append([d.format("YYYY-MM-DDTHH:mm:ss"), int(d.utcoffset().total_seconds())])
    return out
