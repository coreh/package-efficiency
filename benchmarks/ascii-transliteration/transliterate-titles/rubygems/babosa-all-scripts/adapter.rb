require 'babosa'
def operation(value)
  Babosa::Identifier.new(value).transliterate(:cyrillic, :greek, :latin).to_s
end
