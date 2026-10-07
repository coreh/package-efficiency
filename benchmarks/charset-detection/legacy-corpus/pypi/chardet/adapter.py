import chardet

def prepare(hex_text):
    return bytes.fromhex(hex_text)

def operation(data):
    return chardet.detect(data)['encoding']
