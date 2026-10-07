import jwt
def operation(value):
    try:
        claims = jwt.decode(value['token'], value['secret'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return {'status': 'expired', 'claims': None}
    except jwt.InvalidTokenError:
        return {'status': 'invalid-signature', 'claims': None}
    return {'status': 'valid', 'claims': claims}
