require 'timeliness'
def operation(value)
  s = Timeliness.parse(value['to'], :datetime) - Timeliness.parse(value['from'], :datetime)
  [(s / 3600).truncate, (s / 60).truncate, s.truncate]
end
