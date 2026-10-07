from Crypto.Hash import SHA256

def operation(value):
    return SHA256.new(value.encode('utf-8')).digest()

def describe(result):
    return list(result)
