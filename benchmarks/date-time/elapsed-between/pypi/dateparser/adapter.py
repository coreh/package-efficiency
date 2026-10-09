import dateparser
def operation(value):
    s = (dateparser.parse(value["to"]) - dateparser.parse(value["from"])).total_seconds()
    return [int(s / 3600), int(s / 60), int(s)]
