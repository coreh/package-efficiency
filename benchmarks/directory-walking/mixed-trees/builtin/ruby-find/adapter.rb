require 'find'

def operation(input)
  Find.find(input['root']).to_a
end
