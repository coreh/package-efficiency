import regex

compiled = {}

def operation(value):
    pattern = value['pattern']
    r = compiled.get(pattern)
    if r is None:
        r = compiled[pattern] = regex.compile(pattern)
    return r.findall(value['text'])
