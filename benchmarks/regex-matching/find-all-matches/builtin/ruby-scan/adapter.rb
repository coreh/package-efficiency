COMPILED = {}

def operation(value)
  pattern = value['pattern']
  value['text'].scan(COMPILED[pattern] ||= Regexp.new(pattern))
end
