require 'marcel'
require 'stringio'

# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(data)
  Marcel::MimeType.for(StringIO.new(data))
end
