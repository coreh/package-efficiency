require 'builder'

def add(xml, node)
  if node.key?('children')
    xml.tag!(node['name'], node['attrs']) do
      node['children'].each { |child| add(xml, child) }
    end
  else
    xml.tag!(node['name'], node['attrs'], node['text'])
  end
end

def operation(doc)
  xml = Builder::XmlMarkup.new
  add(xml, doc)
  xml.target!
end
