from texttable import Texttable

def _s(c):
    if c is True: return "true"
    if c is False: return "false"
    return str(c)

def operation(value):
    t = Texttable()
    t.add_rows([[_s(h) for h in value["headers"]]] + [[_s(c) for c in r] for r in value["rows"]])
    return t.draw()
