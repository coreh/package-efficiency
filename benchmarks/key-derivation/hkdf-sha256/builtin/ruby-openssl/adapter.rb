require 'openssl'
# Untimed, once per fixture: the hex strings become binary strings.
def prepare(input)
  {
    ikm: [input['ikm']].pack('H*').freeze,
    salt: [input['salt']].pack('H*').freeze,
    info: [input['info']].pack('H*').freeze,
    length: input['length']
  }.freeze
end
def operation(input)
  OpenSSL::KDF.hkdf(input[:ikm], salt: input[:salt], info: input[:info], length: input[:length], hash: 'SHA256')
end
def describe(output)
  output.unpack1('H*')
end
