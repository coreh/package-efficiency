require 'xmlsimple'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

# XmlSimple's default result: attributes are plain string values, child
# elements are arrays, and a text-only element with no attributes is a string
# in its parent's array; with attributes, its text is under the 'content' key.
def text_of(node)
  text = node.is_a?(Hash) ? node['content'] : node
  text.is_a?(Array) ? text.join : text.to_s
end

def operation(value)
  products = in_stock = cents = tags = description_chars = 0
  catalog = XmlSimple.xml_in(value)
  catalog['category'].each do |category|
    category['product'].each do |product|
      products += 1
      in_stock += 1 if product['stock'] == 'true'
      cents += text_of(product['price'][0]).to_i
      tags += product['tags'][0]['tag'].length
      description_chars += non_space(text_of(product['description'][0]))
    end
  end
  { 'products' => products, 'inStock' => in_stock, 'cents' => cents, 'tags' => tags, 'descriptionChars' => description_chars }
end
