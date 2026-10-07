require 'date'
def operation(value)
  ((DateTime.iso8601(value['ts']) >> value['months']) + value['days']).strftime('%Y-%m-%d %H:%M:%S')
end
