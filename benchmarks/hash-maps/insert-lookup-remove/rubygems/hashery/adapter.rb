require 'hashery'

def side(keys, probes, string)
  m = Hashery::Dictionary.new
  keys.each_with_index { |k, i| m[k] = i }
  size = m.size
  hits = 0
  found = 0
  probes.each do |p|
    v = m[p]
    unless v.nil?
      hits += 1
      found += v
    end
  end
  ksum = 0
  vsum = 0
  m.each do |k, v|
    ksum += string ? k.length : k
    vsum += v
  end
  i = 0
  while i < keys.length
    m.delete(keys[i])
    i += 2
  end
  count = m.size
  left = 0
  probes.each { |p| left += 1 if m.key?(p) }
  [size, hits, found, ksum, vsum, count, left]
end

def operation(value)
  side(value["ints"], value["intProbes"], false) + side(value["strings"], value["stringProbes"], true)
end
