require 'jwt'
def operation(value)
  claims, _header = JWT.decode(value['token'], value['secret'], true, algorithm: 'HS256')
  { 'status' => 'valid', 'claims' => claims }
rescue JWT::ExpiredSignature
  { 'status' => 'expired', 'claims' => nil }
rescue JWT::DecodeError
  { 'status' => 'invalid-signature', 'claims' => nil }
end
