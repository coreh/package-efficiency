import ujson
def operation(value):
    try:
        return ujson.loads(value)
    except ValueError:
        return None
