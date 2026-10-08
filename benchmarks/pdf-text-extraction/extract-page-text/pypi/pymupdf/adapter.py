import pymupdf

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    with pymupdf.open(stream=data, filetype='pdf') as doc:  # type: ignore[no-untyped-call]
        return [page.get_text() for page in doc]
