from io import BytesIO
from python_calamine import CalamineWorkbook

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    book = CalamineWorkbook.from_filelike(BytesIO(data))
    return [{'name': name, 'rows': book.get_sheet_by_name(name).to_python()} for name in book.sheet_names]
