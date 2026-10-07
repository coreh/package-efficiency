require 'htmlentities'
CODER = HTMLEntities.new
def operation(value)
  CODER.encode(value)
end
