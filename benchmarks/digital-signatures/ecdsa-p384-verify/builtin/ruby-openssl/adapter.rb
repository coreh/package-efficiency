require 'openssl'
# The SubjectPublicKeyInfo header for an id-ecPublicKey on secp384r1, before
# the 97-byte uncompressed SEC1 point.
SPKI_HEADER = ['3076301006072a8648ce3d020106052b81040022036200'].pack('H*').freeze
# Untimed, once per fixture: hex becomes binary strings, the message its UTF-8
# bytes, and the 96-byte r||s signature the DER SEQUENCE of two INTEGERs that
# OpenSSL takes.
def prepare(input)
  signature = input['signature']
  der = OpenSSL::ASN1::Sequence.new([
    OpenSSL::ASN1::Integer.new(OpenSSL::BN.new(signature[0, 96], 16)),
    OpenSSL::ASN1::Integer.new(OpenSSL::BN.new(signature[96, 96], 16))
  ]).to_der
  {
    point: [input['publicKey']].pack('H*').freeze,
    signature: der.freeze,
    message: input['message'].b.freeze
  }.freeze
end
def operation(input)
  key = OpenSSL::PKey.read(SPKI_HEADER + input[:point])
  key.verify('SHA384', input[:signature], input[:message])
end
