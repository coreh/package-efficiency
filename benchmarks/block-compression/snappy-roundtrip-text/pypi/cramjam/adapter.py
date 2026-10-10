import base64
import cramjam

def operation(value):
    compressed = bytes(cramjam.snappy.compress_raw(value.encode('utf-8')))
    return (compressed, bytes(cramjam.snappy.decompress_raw(compressed)).decode('utf-8'))

# Verifier only (not timed): the block as base64 text.
def describe(result):
    return {'compressed': base64.b64encode(result[0]).decode(), 'text': result[1]}
