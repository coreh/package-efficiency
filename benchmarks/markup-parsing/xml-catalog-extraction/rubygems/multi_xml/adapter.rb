require 'multi_xml'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

def list(x)
  x.is_a?(Array) ? x : [x]
end

def content(x)
  x.is_a?(Hash) ? x['__content__'].to_s : x.to_s
end

def operation(value)
  products = in_stock = cents = tags = description_chars = 0
  MultiXml.parse(value)['catalog']['category'].then { |c| list(c) }.each do |category|
    list(category['product']).each do |product|
      products += 1
      in_stock += 1 if product['stock'] == 'true'
      cents += content(product['price']).to_i
      tags += list(product['tags']['tag']).length
      description_chars += non_space(content(product['description']))
    end
  end
  { 'products' => products, 'inStock' => in_stock, 'cents' => cents, 'tags' => tags, 'descriptionChars' => description_chars }
end
