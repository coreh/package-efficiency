import puremagic

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    try:
        return puremagic.from_string(data, mime=True)
    except puremagic.PureError:
        # puremagic reports "no match" by raising.
        return None
