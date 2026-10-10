import jmespath

# Not timed: runs once per fixture.
def prepare(value):
    return value['document'], [jmespath.compile(e) for e in value['expressions']]

def operation(prepared):
    document, compiled = prepared
    return [c.search(document) for c in compiled]
