require 'rexml/document'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

def operation(value)
  doc = REXML::Document.new(value)
  products = in_stock = cents = tags = description_chars = 0
  doc.elements.each('//product') do |product|
    products += 1
    in_stock += 1 if product.attributes['stock'] == 'true'
    cents += product.elements['price'].text.to_i
    tags += product.elements['tags'].elements.to_a('tag').length
    product.elements['description'].children.each do |c|
      description_chars += non_space(c.value) if c.is_a?(REXML::Text)
    end
  end
  { 'products' => products, 'inStock' => in_stock, 'cents' => cents, 'tags' => tags, 'descriptionChars' => description_chars }
end
