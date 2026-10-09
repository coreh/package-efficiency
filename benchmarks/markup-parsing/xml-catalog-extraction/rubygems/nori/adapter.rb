require 'nori'

def non_space(s)
  s.length - s.count(" \t\n\r")
end

def as_list(x)
  x.is_a?(Array) ? x : [x]
end

def operation(value)
  products = in_stock = cents = tags = description_chars = 0
  catalog = Nori.new.parse(value)['catalog']
  as_list(catalog['category']).each do |category|
    as_list(category['product']).each do |product|
      products += 1
      in_stock += 1 if product['@stock'] == 'true'
      cents += product['price'].to_s.to_i
      tags += as_list(product['tags']['tag']).length
      description_chars += non_space(product['description'].to_s)
    end
  end
  { 'products' => products, 'inStock' => in_stock, 'cents' => cents, 'tags' => tags, 'descriptionChars' => description_chars }
end
