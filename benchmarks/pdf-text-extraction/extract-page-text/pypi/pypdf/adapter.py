import io
from pypdf import PdfReader

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return [page.extract_text() for page in PdfReader(io.BytesIO(data)).pages]
