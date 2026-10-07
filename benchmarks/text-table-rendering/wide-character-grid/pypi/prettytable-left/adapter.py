from prettytable import PrettyTable

def _s(c):
    if c is True: return "true"
    if c is False: return "false"
    return str(c)

def operation(value):
    t = PrettyTable([_s(h) for h in value["headers"]])
    t.add_rows([[_s(c) for c in r] for r in value["rows"]])
    t.align = "l"
    return t.get_string()
