require 'gyoku'

# Gyoku turns nested Hashes into XML. A name maps to an Array of values (one per
# element of that name); :attributes! maps a name to { attribute => [value per
# element] }, which is how Gyoku documents attributes of repeated elements. A
# leaf's value is its text String, which Gyoku escapes.
def body(node)
  h = {}
  attrs = {}
  node['children'].each do |child|
    name = child['name']
    (h[name] ||= []) << (child.key?('children') ? body(child) : child['text'])
    per = (attrs[name] ||= {})
    child['attrs'].each { |k, v| (per[k] ||= []) << v }
  end
  h[:attributes!] = attrs
  h
end

def operation(doc)
  Gyoku.xml(doc['name'] => body(doc), :attributes! => { doc['name'] => doc['attrs'] })
end
