require 'rexml/document'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

def operation(value)
  elements = attributes = text = 0
  stack = [REXML::Document.new(value).root]
  until stack.empty?
    node = stack.pop
    elements += 1
    node.attributes.each_attribute { |a| attributes += a.value.length }
    node.each_child do |child|
      if child.is_a?(REXML::Element)
        stack.push(child)
      elsif child.is_a?(REXML::Text)
        text += non_space(child.value)
      end
    end
  end
  { 'elements' => elements, 'attributes' => attributes, 'text' => text }
end
