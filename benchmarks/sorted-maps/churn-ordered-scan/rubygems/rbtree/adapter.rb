require 'rbtree'

def operation(value)
  t = RBTree.new
  value['keys'].each_with_index { |k, i| t[k] = i }
  removed = value['removals'].map { |k| !t.delete(k).nil? }
  [removed, t.values]
end
