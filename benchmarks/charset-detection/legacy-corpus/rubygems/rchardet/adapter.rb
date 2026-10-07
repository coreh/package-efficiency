require 'rchardet'

def prepare(hex)
  [hex].pack('H*')
end

def operation(data)
  CharDet.detect(data)['encoding']
end
