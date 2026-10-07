require 'write_xlsx'
require 'stringio'

def operation(value)
  io = StringIO.new
  workbook = WriteXLSX.new(io)
  value['sheets'].each do |sheet|
    ws = workbook.add_worksheet(sheet['name'])
    sheet['rows'].each_with_index do |row, y|
      row.each_with_index { |cell, x| cell.is_a?(String) ? ws.write_string(y, x, cell) : ws.write_number(y, x, cell) }
    end
  end
  workbook.close
  io.string
end

# Verifier only (not timed): bytes as an array of integers.
def describe(result)
  result.bytes
end
