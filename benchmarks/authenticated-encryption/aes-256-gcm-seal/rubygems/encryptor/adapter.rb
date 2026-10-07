require 'encryptor'
def prepare(input)
  {
    key: input['key'].b.freeze,
    nonce: input['nonce'].b.freeze,
    aad: input['aad'].b.freeze,
    text: input['text'].b.freeze
  }.freeze
end
def operation(input)
  Encryptor.encrypt(value: input[:text], key: input[:key], iv: input[:nonce], auth_data: input[:aad])
end
def describe(output)
  output.unpack1('H*')
end
