require 'tsort'

def operation(value)
  before = {}
  value['nodes'].each { |node| before[node] = [] }
  value['edges'].each { |first, second| before[second] << first }
  # TSort lists a node after the nodes its block yields, so the block yields
  # what must come first.
  TSort.tsort(->(&block) { before.each_key(&block) }, ->(node, &block) { before[node].each(&block) })
end
