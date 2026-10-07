import re2

compiled = {}

def operation(value):
    pattern = value['pattern']
    r = compiled.get(pattern)
    if r is None:
        r = compiled[pattern] = re2.compile(pattern)
    return [list(m.groups()) for m in r.finditer(value['text'])]
