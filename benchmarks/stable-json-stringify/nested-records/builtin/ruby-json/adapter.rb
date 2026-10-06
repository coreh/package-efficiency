require 'json'
def sorted(value)
  case value
  when Hash then value.keys.sort.to_h { |key| [key, sorted(value[key])] }
  when Array then value.map { |item| sorted(item) }
  else value
  end
end
def operation(value)
  JSON.generate(sorted(value))
end
