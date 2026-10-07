def operation(value)
  producers, messages = value['producers'], value['messages']
  channel = Thread::SizedQueue.new(value['capacity'])
  threads = Array.new(producers) do |p|
    Thread.new do
      messages.times { |i| channel.push(i * producers + p) }
    end
  end
  following = Array.new(producers, 0)
  count = sum = 0
  misplaced = 0
  (producers * messages).times do
    v = channel.pop
    p = v % producers
    misplaced += 1 if v / producers != following[p]
    following[p] += 1
    sum += v
    count += 1
  end
  threads.each(&:join)
  { 'count' => count, 'sum' => sum, 'ordered' => misplaced.zero? }
end
