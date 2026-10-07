require 'dry/inflector'

INFLECTOR = Dry::Inflector.new

def operation(value)
  INFLECTOR.underscore(value)
end
