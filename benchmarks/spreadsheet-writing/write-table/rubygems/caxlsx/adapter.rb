require 'axlsx'

def operation(value)
  package = Axlsx::Package.new
  value['sheets'].each do |sheet|
    package.workbook.add_worksheet(name: sheet['name']) do |ws|
      sheet['rows'].each { |row| ws.add_row(row, types: row.map { |cell| cell.is_a?(String) ? :string : :float }) }
    end
  end
  package.to_stream.read
end

# Verifier only (not timed): bytes as an array of integers.
def describe(result)
  result.bytes
end
