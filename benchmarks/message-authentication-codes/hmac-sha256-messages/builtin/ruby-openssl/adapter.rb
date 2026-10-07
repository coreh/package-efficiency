require 'openssl'
def operation(input)
  OpenSSL::HMAC.digest('SHA256', input['key'], input['text'])
end
def describe(output)
  output.unpack1('H*')
end
