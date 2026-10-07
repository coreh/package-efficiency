def operation(value)
  # a resource is [uses, sum]
  size, callers, cycles = value['size'], value['callers'], value['cycles']
  pool = Thread::Queue.new
  size.times { pool.push([0, 0]) }
  lock = Mutex.new
  active = 0
  peak = 0
  threads = Array.new(callers) do |c|
    Thread.new do
      cycles.times do |j|
        r = pool.pop
        lock.synchronize do
          active += 1
          peak = active if active > peak
        end
        r[0] += 1
        r[1] += (c * 31 + j) % 97 + 1
        Thread.pass
        lock.synchronize { active -= 1 }
        pool.push(r)
      end
    end
  end
  threads.each(&:join)
  # Check out the whole pool at once: a resource never returned would block here.
  held = Array.new(size) { pool.pop }
  { 'cycles' => held.sum { |r| r[0] }, 'checksum' => held.sum { |r| r[1] }, 'peak' => peak, 'drained' => held.size }
end
