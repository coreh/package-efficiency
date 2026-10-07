require 'openssl'

def operation(value)
  OpenSSL::PKCS5.pbkdf2_hmac(value['password'], value['salt'], value['iterations'], value['length'], 'sha256')
end

def describe(result)
  result.bytes
end
