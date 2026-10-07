require 'hashery'

def side(events, drops, string)
  m = Hashery::Dictionary.new
  events.each { |k| m[k] = (m[k] || 0) + 1 }
  mx = 0
  sq = 0
  ws = 0
  m.each do |k, c|
    mx = c if c > mx
    sq += c * c
    ws += (string ? k.length : k) * c
  end
  distinct = m.size
  drops.each do |k|
    c = m[k]
    next if c.nil?
    if c == 1
      m.delete(k)
    else
      m[k] = c - 1
    end
  end
  total = 0
  m.each_value { |c| total += c }
  [distinct, mx, sq, ws, m.size, total]
end

def operation(value)
  side(value["ints"], value["intRetracts"], false) + side(value["strings"], value["stringRetracts"], true)
end
