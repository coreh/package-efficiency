require 'htmlentities'
CODER = HTMLEntities.new
def operation(value)
  CODER.decode(value)
end
