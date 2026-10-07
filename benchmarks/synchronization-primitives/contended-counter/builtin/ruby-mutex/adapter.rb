def operation(value)
  turns = value['turns']
  lock = Mutex.new
  counter = 0
  threads = Array.new(value['threads']) do
    Thread.new do
      mine = 0
      turns.times do
        ticket = lock.synchronize do
          t = counter
          counter = t + 1
          t
        end
        mine += ticket
      end
      mine
    end
  end
  sum = 0
  threads.each { |thread| sum += thread.value }
  { 'count' => counter, 'sum' => sum }
end
