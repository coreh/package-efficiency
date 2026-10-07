import brotli
def operation(value):
    return brotli.decompress(brotli.compress(value.encode('utf-8'))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(brotli.compress(text.encode('utf-8')))}
