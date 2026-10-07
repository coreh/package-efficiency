require 'roo'
require 'stringio'

# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*')
end

def operation(data)
  book = Roo::Excelx.new(StringIO.new(data))
  book.sheets.map { |name| { 'name' => name, 'rows' => book.sheet(name).to_a } }
end
