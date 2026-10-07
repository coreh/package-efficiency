require 'toml-rb'

def operation(value)
  TomlRB.parse(value)
  true
rescue TomlRB::Error
  false
end
