require 'parallel'

def job(seed, rounds)
  x = seed
  rounds.times do
    x ^= (x << 13) & 0xFFFFFFFF
    x ^= x >> 17
    x ^= (x << 5) & 0xFFFFFFFF
  end
  x
end

def operation(value)
  seeds, rounds = value['seeds'], value['rounds']
  Parallel.map(seeds.each_index.to_a, in_threads: value['threads']) { |i| job(seeds[i], rounds[i]) }
end
