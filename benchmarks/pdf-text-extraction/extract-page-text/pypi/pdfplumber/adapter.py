import io
import pdfplumber

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        return [page.extract_text() or '' for page in pdf.pages]
