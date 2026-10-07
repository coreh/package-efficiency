from joserfc import jwt
from joserfc.jwk import OctKey
registry = jwt.JWTClaimsRegistry()
HEADER = {'alg': 'HS256'}
def operation(value):
    key = OctKey.import_key(value['secret'])
    token = jwt.encode(HEADER, value['claims'], key)
    decoded = jwt.decode(token, key, algorithms=['HS256'])
    registry.validate(decoded.claims)
    return {'claims': decoded.claims, 'token': token}
