require 'json/jwt'
def operation(value)
  token = JSON::JWT.new(value['claims']).sign(value['secret'], :HS256).to_s
  claims = JSON::JWT.decode(token, value['secret'])
  { 'claims' => claims, 'token' => token }
end
def describe(result)
  { 'claims' => result['claims'].to_hash, 'token' => result['token'] }
end
