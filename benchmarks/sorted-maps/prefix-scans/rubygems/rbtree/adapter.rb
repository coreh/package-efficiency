require 'rbtree'

def operation(value)
  t = RBTree.new
  value['keys'].each_with_index { |k, i| t[k] = i }
  found = value['lookups'].map { |k| t[k] }
  scans = value['prefixes'].map { |p| t.bound(p, p + "\x7F").map { |_, v| v } }
  [found, scans]
end
