from io import BytesIO
from openpyxl import load_workbook

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    book = load_workbook(BytesIO(data))
    return [{'name': ws.title, 'rows': list(ws.iter_rows(values_only=True))} for ws in book.worksheets]
