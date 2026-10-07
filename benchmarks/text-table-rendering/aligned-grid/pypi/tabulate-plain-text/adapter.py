from tabulate import tabulate

def _s(c):
    if c is True: return "true"
    if c is False: return "false"
    return str(c)

def operation(value):
    return tabulate([[_s(c) for c in r] for r in value["rows"]], headers=[_s(h) for h in value["headers"]], disable_numparse=True)
