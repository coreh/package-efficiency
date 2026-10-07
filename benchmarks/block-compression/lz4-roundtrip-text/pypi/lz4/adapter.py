import lz4.block
def operation(value):
    return lz4.block.decompress(lz4.block.compress(value.encode('utf-8'))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(lz4.block.compress(text.encode('utf-8')))}
