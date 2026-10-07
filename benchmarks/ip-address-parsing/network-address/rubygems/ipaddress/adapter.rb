require 'ipaddress'

def operation(value)
  IPAddress.parse(value).network.to_s
end
