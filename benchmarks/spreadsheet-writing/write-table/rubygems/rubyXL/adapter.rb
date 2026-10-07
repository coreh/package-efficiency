require 'rubyXL'

def operation(value)
  workbook = RubyXL::Workbook.new
  workbook.worksheets.clear
  value['sheets'].each do |sheet|
    ws = workbook.add_worksheet(sheet['name'])
    sheet['rows'].each_with_index do |row, y|
      row.each_with_index { |cell, x| ws.add_cell(y, x, cell) }
    end
  end
  workbook.stream.read
end

# Verifier only (not timed): bytes as an array of integers.
def describe(result)
  result.bytes
end
