require 'concurrent'

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
  pool = Concurrent::FixedThreadPool.new(value['threads'])
  futures = seeds.each_index.map do |i|
    Concurrent::Promises.future_on(pool) { job(seeds[i], rounds[i]) }
  end
  results = futures.map(&:value!)
  pool.shutdown
  pool.wait_for_termination
  results
end
