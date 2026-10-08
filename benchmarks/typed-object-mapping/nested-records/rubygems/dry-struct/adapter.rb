require 'dry-struct'
require 'dry-types'

module Types
  include Dry.Types()
end

class Customer < Dry::Struct
  transform_keys(&:to_sym)
  attribute :name, Types::Strict::String
  attribute :age, Types::Strict::Integer
  attribute :score, Types::Strict::Float
  attribute :active, Types::Strict::Bool
  attribute :nickname, Types::Strict::String.optional
end

class Line < Dry::Struct
  transform_keys(&:to_sym)
  attribute :sku, Types::Strict::String
  attribute :qty, Types::Strict::Integer
  attribute :price, Types::Strict::Float
  attribute :gift, Types::Strict::Bool
  attribute :comment, Types::Strict::String.optional
end

class Order < Dry::Struct
  transform_keys(&:to_sym)
  attribute :id, Types::Strict::Integer
  attribute :ref, Types::Strict::String
  attribute :total, Types::Strict::Float
  attribute :paid, Types::Strict::Bool
  attribute :note, Types::Strict::String.optional
  attribute :tags, Types::Strict::Array.of(Types::Strict::String)
  attribute :customer, Customer
  attribute :lines, Types::Strict::Array.of(Line)
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
