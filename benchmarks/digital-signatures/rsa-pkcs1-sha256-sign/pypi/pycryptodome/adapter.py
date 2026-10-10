from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from Crypto.Hash import SHA256


# Untimed, once per fixture: the PEM is parsed and the message becomes bytes.
def prepare(input):
    return (RSA.import_key(input['privateKey']), input['message'].encode('utf-8'))


def operation(prepared):
    key, message = prepared
    return pkcs1_15.new(key).sign(SHA256.new(message))


def describe(result):
    return list(result)
