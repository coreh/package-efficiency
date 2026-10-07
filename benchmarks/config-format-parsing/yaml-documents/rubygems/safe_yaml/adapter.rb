require 'safe_yaml'
def operation(value)
  SafeYAML.load(value)
end
