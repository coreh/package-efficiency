import re

compiled = {}

def operation(value):
    pattern = value['pattern']
    regex = compiled.get(pattern)
    if regex is None:
        regex = compiled[pattern] = re.compile(pattern)
    return regex.findall(value['text'])
