require 'openssl'
# Untimed, once per fixture: the strings become binary strings.
def prepare(input)
  {
    key: input['key'].b.freeze,
    nonce: input['nonce'].b.freeze,
    aad: input['aad'].b.freeze,
    text: input['text'].b.freeze
  }.freeze
end
def operation(input)
  cipher = OpenSSL::Cipher.new('aes-256-gcm').encrypt
  cipher.key = input[:key]
  cipher.iv = input[:nonce]
  cipher.auth_data = input[:aad]
  cipher.update(input[:text]) + cipher.final + cipher.auth_tag
end
def describe(output)
  output.unpack1('H*')
end
