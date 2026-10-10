import xlrd

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    book = xlrd.open_workbook(file_contents=data)
    out = []
    for sheet in book.sheets():
        out.append({'name': sheet.name, 'rows': [sheet.row_values(r) for r in range(sheet.nrows)]})
    return out
