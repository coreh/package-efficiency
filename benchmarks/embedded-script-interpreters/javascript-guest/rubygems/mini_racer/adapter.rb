require 'mini_racer'

def operation(script)
  MiniRacer::Context.new.eval(script)
end
