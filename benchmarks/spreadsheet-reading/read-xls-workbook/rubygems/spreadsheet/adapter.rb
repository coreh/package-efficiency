require 'spreadsheet'
require 'stringio'

# Not timed: runs once per fixture.
def prepare(value)
  [value].pack('H*')
end

def operation(data)
  book = Spreadsheet.open(StringIO.new(data))
  book.worksheets.map { |ws| { 'name' => ws.name, 'rows' => ws.rows.map(&:to_a) } }
end

# Not timed: dates become ISO text for the check.
def describe(result)
  result.map do |s|
    { 'name' => s['name'], 'rows' => s['rows'].map { |row| row.map { |c| c.respond_to?(:iso8601) ? c.iso8601 : c } } }
  end
end
