import zstandard
def operation(value):
    return zstandard.decompress(zstandard.compress(value.encode('utf-8'))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(zstandard.compress(text.encode('utf-8')))}
