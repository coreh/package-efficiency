import orjson
def operation(value):
    try:
        return orjson.loads(value)
    except ValueError:
        return None
