def operation(input)
  root = input['root']
  input['patterns'].map { |pattern| Dir.glob(pattern, base: root) }
end
