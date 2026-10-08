require 'babosa'
def operation(value)
  Babosa::Identifier.new(value).transliterate.to_s
end
