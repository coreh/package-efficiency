require 'simpleidn'
def operation(value)
  SimpleIDN.to_ascii(value)
end
