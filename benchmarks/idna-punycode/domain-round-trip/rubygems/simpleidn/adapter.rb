require 'simpleidn'
def operation(value)
  ascii = SimpleIDN.to_ascii(value)
  [ascii, SimpleIDN.to_unicode(ascii)]
end
