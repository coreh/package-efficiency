require 'stringio'
require 'pdf/reader'

# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(data)
  PDF::Reader.new(StringIO.new(data)).pages.map(&:text)
end
