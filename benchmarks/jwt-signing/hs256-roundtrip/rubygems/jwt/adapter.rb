require 'jwt'
def operation(value)
  token = JWT.encode(value['claims'], value['secret'], 'HS256')
  claims, _header = JWT.decode(token, value['secret'], true, algorithm: 'HS256')
  { 'claims' => claims, 'token' => token }
end
