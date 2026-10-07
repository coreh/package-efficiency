require 'openssl'
require 'securerandom'

def operation(value)
  password, wrong = value
  salt = SecureRandom.random_bytes(16)
  key = OpenSSL::KDF.scrypt(password, salt: salt, N: 4096, r: 8, p: 1, length: 32)
  [
    OpenSSL.fixed_length_secure_compare(OpenSSL::KDF.scrypt(password, salt: salt, N: 4096, r: 8, p: 1, length: 32), key),
    OpenSSL.fixed_length_secure_compare(OpenSSL::KDF.scrypt(wrong, salt: salt, N: 4096, r: 8, p: 1, length: 32), key)
  ]
end
