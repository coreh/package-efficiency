require 'hana'

def operation(value)
  document = value['document']
  value['pointers'].map { |pointer| Hana::Pointer.new(pointer).eval(document) }
end
