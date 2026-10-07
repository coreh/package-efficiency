from datetime import datetime
def operation(value):
    s = (datetime.fromisoformat(value["to"]) - datetime.fromisoformat(value["from"])).total_seconds()
    return [int(s / 3600), int(s / 60), int(s)]
