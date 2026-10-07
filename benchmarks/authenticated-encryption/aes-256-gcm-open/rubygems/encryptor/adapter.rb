require 'encryptor'
def prepare(input)
  {
    key: input['key'].b.freeze,
    nonce: input['nonce'].b.freeze,
    aad: input['aad'].b.freeze,
    sealed: input['sealed'].encode('ISO-8859-1').b.freeze
  }.freeze
end
def operation(input)
  Encryptor.decrypt(value: input[:sealed], key: input[:key], iv: input[:nonce], auth_data: input[:aad])
end
def describe(output)
  output.unpack1('H*')
end
