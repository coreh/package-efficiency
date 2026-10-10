require 'openssl'
# Untimed, once per fixture: the PKCS#1 PEM becomes an OpenSSL::PKey::RSA.
def prepare(input)
  { key: OpenSSL::PKey::RSA.new(input['privateKey']), message: input['message'].b.freeze }.freeze
end
def operation(input)
  input[:key].sign('SHA256', input[:message])
end
def describe(result)
  result.bytes
end
