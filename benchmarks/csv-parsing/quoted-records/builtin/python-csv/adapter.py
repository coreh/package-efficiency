import csv
import io

def operation(value):
    return list(csv.reader(io.StringIO(value, newline='')))
