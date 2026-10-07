# Not timed: the fixture's binary string becomes bytes once, tagged with the
# encoding they are in. The operation does not change the prepared string.
def prepare(value)
  value['bytes'].encode('ISO-8859-1').force_encoding(value['encoding']).freeze
end

def operation(bytes)
  bytes.encode('UTF-8')
end
