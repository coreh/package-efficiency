require 'csv'

def operation(value)
  CSV.generate do |csv|
    value.each { |row| csv << row }
  end
end
