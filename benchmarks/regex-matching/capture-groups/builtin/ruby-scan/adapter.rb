COMPILED = {}

def operation(value)
  pattern = value['pattern']
  # With capture groups, scan returns one array of group strings per match.
  value['text'].scan(COMPILED[pattern] ||= Regexp.new(pattern))
end
