import hashlib
import hmac

def operation(input):
    return hmac.new(input['key'].encode(), input['text'].encode(), hashlib.sha256).digest()

def describe(output):
    return output.hex()
