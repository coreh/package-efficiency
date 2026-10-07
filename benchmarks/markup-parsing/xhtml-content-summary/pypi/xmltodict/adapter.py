import xmltodict

def non_space(s):
    return len(s) - s.count(" ") - s.count("\t") - s.count("\n") - s.count("\r")

def walk(value, acc):
    # value is the parsed content of one element: None, str or dict.
    acc[0] += 1
    if isinstance(value, str):
        acc[2] += non_space(value)
    elif isinstance(value, dict):
        for key, item in value.items():
            if key[0] == '@':
                acc[1] += len(item)
            elif key == '#text':
                acc[2] += non_space(item)
            else:
                for child in (item if isinstance(item, list) else [item]):
                    walk(child, acc)

def operation(value):
    acc = [0, 0, 0]
    for name, content in xmltodict.parse(value).items():
        walk(content, acc)
    return {'elements': acc[0], 'attributes': acc[1], 'text': acc[2]}
