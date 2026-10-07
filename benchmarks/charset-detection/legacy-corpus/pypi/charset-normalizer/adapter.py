import charset_normalizer

def prepare(hex_text):
    return bytes.fromhex(hex_text)

def operation(data):
    best = charset_normalizer.from_bytes(data).best()
    return best.encoding if best is not None else None
