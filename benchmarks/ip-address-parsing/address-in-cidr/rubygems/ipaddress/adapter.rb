require 'ipaddress'

def operation(value)
  IPAddress.parse(value[1]).include?(IPAddress.parse(value[0]))
end
