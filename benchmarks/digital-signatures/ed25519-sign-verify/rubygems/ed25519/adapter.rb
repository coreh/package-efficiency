require 'ed25519'

def operation(input)
  seed = [input['seed']].pack('H*')
  pub = [input['publicKey']].pack('H*')
  msg = input['message']
  sig = Ed25519::SigningKey.new(seed).sign(msg)
  Ed25519::VerifyKey.new(pub).verify(sig, msg)
  sig
end

def describe(sig)
  sig.unpack1('H*')
end
