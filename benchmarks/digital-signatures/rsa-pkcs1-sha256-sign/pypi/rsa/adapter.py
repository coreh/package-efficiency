import rsa


# Untimed, once per fixture: the PEM is parsed and the message becomes bytes.
def prepare(input):
    return (rsa.PrivateKey.load_pkcs1(input['privateKey'].encode()), input['message'].encode('utf-8'))


def operation(prepared):
    key, message = prepared
    return rsa.sign(message, key, 'SHA-256')


def describe(result):
    return list(result)
