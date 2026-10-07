require 'text'
def operation(value)
  Text::Levenshtein.distance(value[0], value[1])
end
