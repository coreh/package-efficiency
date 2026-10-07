import bz2
# Level 9, passed explicitly (it is also the default): the same level as the other bzip2 entries of this task.
LEVEL = 9
def operation(value):
    return bz2.decompress(bz2.compress(value.encode('utf-8'), LEVEL)).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(bz2.compress(text.encode('utf-8'), LEVEL))}
