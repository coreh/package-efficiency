import io
from openpyxl import Workbook

def operation(value):
    workbook = Workbook()
    workbook.remove(workbook.active)
    for sheet in value['sheets']:
        worksheet = workbook.create_sheet(sheet['name'])
        for row in sheet['rows']:
            worksheet.append(row)
    out = io.BytesIO()
    workbook.save(out)
    return out.getvalue()

# Verifier only (not timed): bytes as a list of integers.
def describe(result):
    return list(result)
