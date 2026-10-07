require 'shellwords'

def operation(value)
  Shellwords.join(value['words'])
end
