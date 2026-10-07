require 'terminal-table'

def operation(value)
  Terminal::Table.new(headings: value["headers"].map(&:to_s), rows: value["rows"].map { |r| r.map(&:to_s) }).to_s
end
