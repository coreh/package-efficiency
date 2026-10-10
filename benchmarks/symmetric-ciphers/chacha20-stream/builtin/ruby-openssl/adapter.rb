require 'openssl'
# Untimed, once per fixture: the strings become binary strings, and the 16-byte
# IV OpenSSL takes is built: the 32-bit block counter 0 (little-endian), then the nonce.
def prepare(input)
  {
    key: input['key'].b.freeze,
    iv: ("\0\0\0\0".b + input['nonce'].b).freeze,
    text: input['text'].b.freeze
  }.freeze
end
def operation(input)
  cipher = OpenSSL::Cipher.new('chacha20').encrypt
  cipher.key = input[:key]
  cipher.iv = input[:iv]
  cipher.update(input[:text]) + cipher.final
end
def describe(output)
  output.unpack1('H*')
end
