require 'rouge'

# Set up once: the formatter and one lexer per language.
FORMATTER = Rouge::Formatters::HTML.new
LEXERS = { 'javascript' => Rouge::Lexers::Javascript.new, 'python' => Rouge::Lexers::Python.new }

def operation(input)
  FORMATTER.format(LEXERS.fetch(input['language']).lex(input['code']))
end
