def operation(value)
  window, items = value
  queue = []
  out = []
  items.each do |item|
    queue.push(item)
    out.push(queue.shift) if queue.length > window
  end
  held = queue.length
  out.push(queue.shift) until queue.empty?
  out.push(held)
  out
end
