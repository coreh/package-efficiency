require 'nokogiri'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

def operation(value)
  elements = attributes = text = 0
  Nokogiri::XML(value).root.traverse do |node|
    if node.element?
      elements += 1
      node.attribute_nodes.each { |a| attributes += a.value.length }
    elsif node.text? || node.cdata?
      text += non_space(node.content)
    end
  end
  { 'elements' => elements, 'attributes' => attributes, 'text' => text }
end
