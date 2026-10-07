from urllib.parse import parse_qsl

def operation(value):
    return dict(parse_qsl(value))
