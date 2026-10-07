import arrow
def operation(value):
    s = (arrow.get(value["to"]) - arrow.get(value["from"])).total_seconds()
    return [int(s / 3600), int(s / 60), int(s)]
