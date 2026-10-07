require 'crass'

def operation(css)
  Crass.parse(css)
end

# Verifier view: the same nodes without the duplicate :tokens lists and the
# bracket characters of simple blocks.
def strip(node)
  case node
  when Array then node.map { |n| strip(n) }
  when Hash
    node.each_with_object({}) do |(k, v), h|
      next if k == :tokens || k == :start || k == :end
      h[k] = strip(v)
    end
  else node
  end
end

def describe(result)
  rules = strip(result.reject { |n| n[:node] == :whitespace })
  { 'type' => 'stylesheet', 'stylesheet' => { 'rules' => rules }, 'rules' => rules }
end
