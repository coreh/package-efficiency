import zlib
def operation(value):
    return zlib.crc32(value.encode("utf-8"))
