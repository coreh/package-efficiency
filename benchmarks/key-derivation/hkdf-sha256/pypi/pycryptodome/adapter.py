from Crypto.Protocol.KDF import HKDF
from Crypto.Hash import SHA256

# Not timed: runs once per fixture.
def prepare(value):
    return (bytes.fromhex(value['ikm']), bytes.fromhex(value['salt']), bytes.fromhex(value['info']), value['length'])

def operation(value):
    ikm, salt, info, length = value
    return HKDF(ikm, length, salt, SHA256, context=info)

def describe(result):
    return result.hex()
