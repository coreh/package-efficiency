import zlib
def operation(chunks):
    crc = 0
    for chunk in chunks:
        crc = zlib.crc32(chunk.encode("utf-8"), crc)
    return crc
