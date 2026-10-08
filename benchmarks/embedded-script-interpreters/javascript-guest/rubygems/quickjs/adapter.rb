require 'quickjs'

def operation(script)
  Quickjs.eval_code(script)
end
