require 'uuidtools'
def operation(value)
  UUIDTools::UUID.random_create.to_s
end
