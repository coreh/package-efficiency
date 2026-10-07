require 'rexml/document'

def add(parent, node)
  element = parent.add_element(node['name'], node['attrs'])
  if node.key?('children')
    node['children'].each { |child| add(element, child) }
  else
    element.add_text(node['text'])
  end
end

def operation(doc)
  document = REXML::Document.new
  add(document, doc)
  out = +''
  document.write(out)
  out
end
