import csv
import io

def operation(value):
    out = io.StringIO()
    csv.writer(out).writerows(value)
    return out.getvalue()
