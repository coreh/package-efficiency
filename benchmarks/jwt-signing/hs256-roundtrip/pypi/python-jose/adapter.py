from jose import jwt
def operation(value):
    token = jwt.encode(value['claims'], value['secret'], algorithm='HS256')
    claims = jwt.decode(token, value['secret'], algorithms=['HS256'])
    return {'claims': claims, 'token': token}
