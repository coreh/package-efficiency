import cchardet

def prepare(hex_text):
    return bytes.fromhex(hex_text)

def operation(data):
    return cchardet.detect(data)['encoding']
