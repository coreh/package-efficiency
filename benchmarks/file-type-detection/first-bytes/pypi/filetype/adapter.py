import filetype

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return filetype.guess_mime(data)
