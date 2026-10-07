require 'openssl'
# Untimed, once per fixture: the strings become binary strings.
def prepare(input)
  {
    key: input['key'].b.freeze,
    nonce: input['nonce'].b.freeze,
    aad: input['aad'].b.freeze,
    sealed: input['sealed'].encode('ISO-8859-1').b.freeze
  }.freeze
end
def operation(input)
  data = input[:sealed]
  n = data.bytesize - 16
  cipher = OpenSSL::Cipher.new('aes-256-gcm').decrypt
  cipher.key = input[:key]
  cipher.iv = input[:nonce]
  cipher.auth_tag = data.byteslice(n, 16)
  cipher.auth_data = input[:aad]
  cipher.update(data.byteslice(0, n)) + cipher.final
end
def describe(output)
  output.unpack1('H*')
end
