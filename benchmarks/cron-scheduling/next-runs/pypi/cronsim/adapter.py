from datetime import datetime, timezone
from cronsim import CronSim

def operation(value):
    it = CronSim(value["pattern"], datetime.fromtimestamp(value["start"] / 1000, timezone.utc))
    return [next(it) for _ in range(value["count"])]

def describe(result):
    return [round(d.timestamp() * 1000) for d in result]
