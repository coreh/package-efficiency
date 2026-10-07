require 'time'
def operation(value)
  s = Time.iso8601(value['to']) - Time.iso8601(value['from'])
  [(s / 3600).to_i, (s / 60).to_i, s.to_i]
end
