require 'inflecto'
def operation(words)
  out = []
  words.each do |word|
    p = Inflecto.pluralize(word)
    out << p
    out << Inflecto.singularize(p)
  end
  out
end
