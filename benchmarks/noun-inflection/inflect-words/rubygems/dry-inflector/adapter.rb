require 'dry/inflector'
INFLECTOR = Dry::Inflector.new
def operation(words)
  out = []
  words.each do |word|
    p = INFLECTOR.pluralize(word)
    out << p
    out << INFLECTOR.singularize(p)
  end
  out
end
