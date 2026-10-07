from urllib.parse import quote
def operation(value):
    return quote(value, safe="")
