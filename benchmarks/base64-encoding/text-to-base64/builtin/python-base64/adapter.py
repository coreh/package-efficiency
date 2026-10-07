import base64
def operation(value):
    return base64.b64encode(value.encode('utf-8'))

# b64encode returns bytes; the verifier needs text. Outside measured work.
def describe(encoded):
    return encoded.decode('ascii')
