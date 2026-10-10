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
  queue = Thread::Queue.new
  seeds.each_index { |i| queue.push(i) }
  queue.close
  results = Array.new(seeds.length, 0)
  workers = Array.new(value['threads']) do
    Thread.new do
      while (i = queue.pop)
        results[i] = job(seeds[i], rounds[i])
      end
    end
  end
  workers.each(&:join)
  results
end
