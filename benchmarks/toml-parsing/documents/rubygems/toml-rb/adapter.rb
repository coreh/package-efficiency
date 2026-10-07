require 'toml-rb'

def operation(value)
  TomlRB.parse(value)
end
