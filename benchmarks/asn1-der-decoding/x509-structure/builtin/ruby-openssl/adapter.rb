require 'openssl'
CLASSES = { UNIVERSAL: 0, APPLICATION: 1, CONTEXT_SPECIFIC: 2, PRIVATE: 3 }.freeze
def walk(node, out)
  out << CLASSES[node.tag_class] * 100 + node.tag
  value = node.value
  value.each { |child| walk(child, out) } if value.is_a?(Array)
end
# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(der)
  out = []
  walk(OpenSSL::ASN1.decode(der), out)
  out
end
