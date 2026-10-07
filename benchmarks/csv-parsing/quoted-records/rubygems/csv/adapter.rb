require 'csv'

# CSV returns nil for an unquoted empty field; nil_value makes it "" as it parses.
def operation(value)
  CSV.parse(value, nil_value: '')
end
