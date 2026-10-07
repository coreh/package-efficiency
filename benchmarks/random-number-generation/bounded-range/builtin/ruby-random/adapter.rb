def operation(value)
  rng = Random.new(value['seed'])
  range = value['min']..value['max']
  Array.new(value['count']) { rng.rand(range) }
end
