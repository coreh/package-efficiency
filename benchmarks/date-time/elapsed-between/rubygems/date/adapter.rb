require 'date'
def operation(value)
  s = (DateTime.rfc3339(value['to']) - DateTime.rfc3339(value['from'])) * 86400
  [(s / 3600).truncate, (s / 60).truncate, s.truncate]
end
