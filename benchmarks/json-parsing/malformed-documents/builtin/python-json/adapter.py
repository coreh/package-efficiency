import json
def operation(value):
    try:
        return json.loads(value)
    except ValueError:
        return None
