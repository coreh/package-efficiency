require 'active_support'
require 'active_support/core_ext/string/inflections'
def operation(words)
  out = []
  words.each do |word|
    p = word.pluralize
    out << p
    out << p.singularize
  end
  out
end
