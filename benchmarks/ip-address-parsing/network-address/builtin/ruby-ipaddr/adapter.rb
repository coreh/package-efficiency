require 'ipaddr'

def operation(value)
  IPAddr.new(value).to_s
end
