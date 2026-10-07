import hashlib, hmac, os

def operation(value):
    password, wrong = value
    salt = os.urandom(16)
    key = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=4096, r=8, p=1, dklen=32)
    return [
        hmac.compare_digest(hashlib.scrypt(password.encode('utf-8'), salt=salt, n=4096, r=8, p=1, dklen=32), key),
        hmac.compare_digest(hashlib.scrypt(wrong.encode('utf-8'), salt=salt, n=4096, r=8, p=1, dklen=32), key),
    ]
