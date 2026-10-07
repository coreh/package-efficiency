from dateutil import parser
def operation(value):
    s = (parser.isoparse(value["to"]) - parser.isoparse(value["from"])).total_seconds()
    return [int(s / 3600), int(s / 60), int(s)]
