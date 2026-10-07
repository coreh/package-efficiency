from jose import jwt
from jose.exceptions import ExpiredSignatureError, JOSEError
def operation(value):
    try:
        claims = jwt.decode(value['token'], value['secret'], algorithms=['HS256'])
    except ExpiredSignatureError:
        return {'status': 'expired', 'claims': None}
    except JOSEError:
        return {'status': 'invalid-signature', 'claims': None}
    return {'status': 'valid', 'claims': claims}
