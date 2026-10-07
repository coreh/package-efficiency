import simplejson
def operation(value):
    try:
        return simplejson.loads(value)
    except ValueError:
        return None
