from Crypto.Cipher import ChaCha20_Poly1305

# Untimed, once per fixture: the four strings become bytes.
def prepare(value):
    return tuple(value[k].encode('utf-8') for k in ('key', 'nonce', 'aad', 'text'))

def operation(value):
    key, nonce, aad, text = value
    cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
    cipher.update(aad)
    ct, tag = cipher.encrypt_and_digest(text)
    return ct + tag

def describe(result):
    return result.hex()
