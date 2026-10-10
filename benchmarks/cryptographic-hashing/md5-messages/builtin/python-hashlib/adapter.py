import hashlib

def operation(value):
    return hashlib.md5(value.encode('utf-8')).digest()

def describe(result):
    return list(result)
