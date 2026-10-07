require 'ipaddr'

def operation(value)
  IPAddr.new(value[1]).include?(IPAddr.new(value[0]))
end
