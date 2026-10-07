from semver import Version

def operation(values):
    parsed = [Version.parse(v) for v in values]
    order = sorted(range(len(values)), key=parsed.__getitem__)
    return [values[i] for i in order]
