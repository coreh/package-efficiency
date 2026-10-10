import pendulum
from pendulum import DateTime

# Untimed, once per fixture: the zone is created by name.
def prepare(value):
    return (pendulum.timezone(value["zone"]), value["instants"])

def operation(value):
    zone, instants = value
    out = []
    for t in instants:
        d = DateTime.fromtimestamp(t, tz=zone)
        out.append([d.strftime("%Y-%m-%dT%H:%M:%S"), int(d.utcoffset().total_seconds())])
    return out
