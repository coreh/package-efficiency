import hashlib

def operation(value):
    return hashlib.sha3_256(value.encode('utf-8')).digest()

def describe(result):
    return list(result)
