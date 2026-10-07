from joserfc import jwt
from joserfc.errors import ExpiredTokenError, JoseError
from joserfc.jwk import OctKey
registry = jwt.JWTClaimsRegistry()
def operation(value):
    try:
        key = OctKey.import_key(value['secret'])
        decoded = jwt.decode(value['token'], key, algorithms=['HS256'])
        registry.validate(decoded.claims)
    except ExpiredTokenError:
        return {'status': 'expired', 'claims': None}
    except JoseError:
        return {'status': 'invalid-signature', 'claims': None}
    return {'status': 'valid', 'claims': decoded.claims}
