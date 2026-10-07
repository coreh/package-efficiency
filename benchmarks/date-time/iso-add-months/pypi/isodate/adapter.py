import isodate
from isodate import Duration
def operation(value):
    t = isodate.parse_datetime(value["ts"]) + Duration(months=value["months"]) + Duration(days=value["days"])
    return t.strftime("%Y-%m-%d %H:%M:%S")
