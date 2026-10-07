def operation(value)
  rng = Random.new(value['seed'])
  Array.new(value['count']) { rng.rand(4294967296) }
end
