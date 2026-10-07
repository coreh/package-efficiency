import io
import xlsxwriter

def operation(value):
    out = io.BytesIO()
    workbook = xlsxwriter.Workbook(out, {'in_memory': True})
    for sheet in value['sheets']:
        worksheet = workbook.add_worksheet(sheet['name'])
        for y, row in enumerate(sheet['rows']):
            worksheet.write_row(y, 0, row)
    workbook.close()
    return out.getvalue()

# Verifier only (not timed): bytes as a list of integers.
def describe(result):
    return list(result)
