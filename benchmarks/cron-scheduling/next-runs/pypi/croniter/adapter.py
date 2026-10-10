from datetime import datetime, timezone
from croniter import croniter

def operation(value):
    it = croniter(value["pattern"], datetime.fromtimestamp(value["start"] / 1000, timezone.utc))
    return [it.get_next(datetime) for _ in range(value["count"])]

def describe(result):
    return [round(d.timestamp() * 1000) for d in result]
