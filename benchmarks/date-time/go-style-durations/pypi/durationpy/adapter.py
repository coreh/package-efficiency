import durationpy

def operation(value):
    out = []
    for s in value:
        out.append(durationpy.from_str(s).total_seconds())
    return out
