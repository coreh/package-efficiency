from ecdsa import VerifyingKey, SECP256k1, BadSignatureError


# Untimed, once per fixture: hex becomes bytes.
def prepare(input):
    return (bytes.fromhex(input['publicKey']), bytes.fromhex(input['signature']), bytes.fromhex(input['digest']))


def operation(prepared):
    public, signature, digest = prepared
    try:
        return VerifyingKey.from_string(public, curve=SECP256k1).verify_digest(signature, digest)
    except BadSignatureError:
        return False
