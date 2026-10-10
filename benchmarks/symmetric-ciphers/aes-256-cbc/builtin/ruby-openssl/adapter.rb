require 'openssl'
# Untimed, once per fixture: the strings become binary strings.
def prepare(input)
  {
    key: input['key'].b.freeze,
    iv: input['iv'].b.freeze,
    text: input['text'].b.freeze
  }.freeze
end
def operation(input)
  cipher = OpenSSL::Cipher.new('aes-256-cbc').encrypt
  cipher.key = input[:key]
  cipher.iv = input[:iv]
  cipher.update(input[:text]) + cipher.final
end
def describe(output)
  output.unpack1('H*')
end
