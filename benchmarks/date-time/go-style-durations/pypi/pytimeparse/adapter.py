import pytimeparse

def operation(value):
    out = []
    for s in value:
        out.append(pytimeparse.parse(s))
    return out
