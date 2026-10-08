require 'virtus'

class Customer
  include Virtus.model
  attribute :name, String
  attribute :age, Integer
  attribute :score, Float
  attribute :active, Boolean
  attribute :nickname, String
end

class Line
  include Virtus.model
  attribute :sku, String
  attribute :qty, Integer
  attribute :price, Float
  attribute :gift, Boolean
  attribute :comment, String
end

class Order
  include Virtus.model
  attribute :id, Integer
  attribute :ref, String
  attribute :total, Float
  attribute :paid, Boolean
  attribute :note, String
  attribute :tags, Array[String]
  attribute :customer, Customer
  attribute :lines, Array[Line]
end

def operation(value)
  record = Order.new(value)
  [record, record.to_h]
end

def describe(result)
  record, plain = result
  {
    'classes' => [record.class.name, record.customer.class.name, record.lines[0].class.name],
    'customer' => record.customer.name,
    'lines' => record.lines.length,
    'first' => record.lines[0].sku,
    'plain' => plain
  }
end
