require 'rubyXL'

# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*')
end

def operation(data)
  book = RubyXL::Parser.parse_buffer(data)
  book.worksheets.map do |ws|
    { 'name' => ws.sheet_name, 'rows' => ws.sheet_data.rows.map { |row| row.cells.map { |cell| cell && cell.value } } }
  end
end
