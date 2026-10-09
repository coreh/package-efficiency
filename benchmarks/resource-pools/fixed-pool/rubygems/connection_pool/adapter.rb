require 'connection_pool'

def operation(value)
  # a resource is [uses, sum]
  size, callers, cycles = value['size'], value['callers'], value['cycles']
  pool = ConnectionPool.new(size: size) { [0, 0] }
  lock = Mutex.new
  active = 0
  peak = 0
  threads = Array.new(callers) do |c|
    Thread.new do
      cycles.times do |j|
        pool.with do |r|
          lock.synchronize do
            active += 1
            peak = active if active > peak
          end
          r[0] += 1
          r[1] += (c * 31 + j) % 97 + 1
          Thread.pass
          lock.synchronize { active -= 1 }
        end
      end
    end
  end
  threads.each(&:join)
  # Take every resource out of the pool for good: shutdown yields each resource
  # that is back in the pool, so one that was never returned would be missing.
  held = []
  pool.shutdown { |r| held << r }
  { 'cycles' => held.sum { |r| r[0] }, 'checksum' => held.sum { |r| r[1] }, 'peak' => peak, 'drained' => held.size }
end
