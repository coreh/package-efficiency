require 'deep_merge'

def operation(sources)
  sources.each_with_object({}) { |source, result| DeepMerge.deep_merge!(source, result, merge_nil_values: true) }
end
