require 'commonmarker'

def operation(text)
  out = []
  Commonmarker.parse(text).each do |node|
    out << [node.header_level, node.first_child.string_content] if node.type == :heading
  end
  out
end
