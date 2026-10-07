import hashlib

def operation(value):
    return hashlib.pbkdf2_hmac('sha256', value['password'].encode('utf-8'), value['salt'].encode('utf-8'), value['iterations'], value['length'])

def describe(result):
    return list(result)
