import bz2
# Level 9, passed explicitly (it is also the default): the same level as the other bzip2 entries of this task.
LEVEL = 9
def operation(value):
    return bz2.compress(value.encode('utf-8'), LEVEL)

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': bz2.decompress(packed).decode('utf-8'), 'compressedBytes': len(packed)}
