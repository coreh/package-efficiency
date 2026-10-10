require 'openssl'
# The SubjectPublicKeyInfo header for an id-ecPublicKey on secp256k1, before a
# compressed (33-byte) or uncompressed (65-byte) SEC1 point.
SPKI_HEADER = {
  33 => ['3036301006072a8648ce3d020106052b8104000a032200'].pack('H*').freeze,
  65 => ['3056301006072a8648ce3d020106052b8104000a034200'].pack('H*').freeze
}.freeze
# Untimed, once per fixture: hex becomes binary strings, and the 64-byte r||s
# signature becomes the DER SEQUENCE of two INTEGERs that OpenSSL takes.
def prepare(input)
  signature = input['signature']
  der = OpenSSL::ASN1::Sequence.new([
    OpenSSL::ASN1::Integer.new(OpenSSL::BN.new(signature[0, 64], 16)),
    OpenSSL::ASN1::Integer.new(OpenSSL::BN.new(signature[64, 64], 16))
  ]).to_der
  {
    point: [input['publicKey']].pack('H*').freeze,
    signature: der.freeze,
    digest: [input['digest']].pack('H*').freeze
  }.freeze
end
def operation(input)
  point = input[:point]
  key = OpenSSL::PKey.read(SPKI_HEADER.fetch(point.bytesize) + point)
  key.verify_raw(nil, input[:signature], input[:digest])
end
