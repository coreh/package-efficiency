require 'shellwords'

def operation(value)
  Shellwords.split(value['line'])
end
