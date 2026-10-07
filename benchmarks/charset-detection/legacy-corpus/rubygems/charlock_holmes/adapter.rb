require 'charlock_holmes'

def prepare(hex)
  [hex].pack('H*')
end

def operation(data)
  CharlockHolmes::EncodingDetector.detect(data)[:encoding]
end
