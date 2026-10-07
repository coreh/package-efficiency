def operation(items)
  dq = []
  out = []
  items.each do |x|
    op = x & 3
    if op == 0
      dq.push(x)
    elsif op == 1
      dq.unshift(x)
    elsif !dq.empty?
      out.push(op == 2 ? dq.shift : dq.pop)
    end
  end
  out.push(-1)
  out.push(dq.shift) until dq.empty?
  out
end
