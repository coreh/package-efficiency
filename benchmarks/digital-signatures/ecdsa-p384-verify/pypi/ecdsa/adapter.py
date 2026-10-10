from hashlib import sha384
from ecdsa import VerifyingKey, NIST384p, BadSignatureError


# Untimed, once per fixture: hex becomes bytes and the message its UTF-8 bytes.
def prepare(input):
    return (bytes.fromhex(input['publicKey']), bytes.fromhex(input['signature']), input['message'].encode('utf-8'))


def operation(prepared):
    public, signature, message = prepared
    try:
        return VerifyingKey.from_string(public, curve=NIST384p, hashfunc=sha384).verify(signature, message)
    except BadSignatureError:
        return False
