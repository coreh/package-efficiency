import isodate
def operation(value):
    s = (isodate.parse_datetime(value["to"]) - isodate.parse_datetime(value["from"])).total_seconds()
    return [int(s / 3600), int(s / 60), int(s)]
