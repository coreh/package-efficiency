from Crypto.Hash import SHA3_256

def operation(value):
    return SHA3_256.new(value.encode('utf-8')).digest()

def describe(result):
    return list(result)
