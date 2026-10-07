require 'nokogiri'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

def operation(value)
  doc = Nokogiri::XML(value)
  products = doc.xpath('//product')
  {
    'products' => products.length,
    'inStock' => products.count { |p| p['stock'] == 'true' },
    'cents' => doc.xpath('//price').sum { |p| p.text.to_i },
    'tags' => doc.xpath('//tag').length,
    'descriptionChars' => doc.xpath('//description').sum { |d| non_space(d.text) }
  }
end
