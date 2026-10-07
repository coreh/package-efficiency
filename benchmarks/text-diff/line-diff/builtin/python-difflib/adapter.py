import difflib

TAGS = {'equal': '=', 'delete': '-', 'insert': '+'}

def operation(value):
    a = value['a'].splitlines()
    b = value['b'].splitlines()
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes():
        if tag == 'replace':
            out.append(['-', i2 - i1])
            out.append(['+', j2 - j1])
        elif tag == 'equal':
            out.append(['=', i2 - i1])
        elif tag == 'delete':
            out.append(['-', i2 - i1])
        else:
            out.append(['+', j2 - j1])
    return out
