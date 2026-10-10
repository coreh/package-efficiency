from Crypto.Hash import MD5

def operation(value):
    return MD5.new(value.encode('utf-8')).digest()

def describe(result):
    return list(result)
