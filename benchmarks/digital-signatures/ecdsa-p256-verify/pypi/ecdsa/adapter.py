from hashlib import sha256
from ecdsa import VerifyingKey, NIST256p, BadSignatureError


def operation(input):
    try:
        vk = VerifyingKey.from_string(bytes.fromhex(input['publicKey']), curve=NIST256p, hashfunc=sha256)
        return vk.verify(bytes.fromhex(input['signature']), input['message'].encode('utf-8'))
    except BadSignatureError:
        return False
