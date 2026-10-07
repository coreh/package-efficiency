import rfc3986
def operation(value):
    return rfc3986.uri_reference(value[1]).resolve_with(value[0]).unsplit()
