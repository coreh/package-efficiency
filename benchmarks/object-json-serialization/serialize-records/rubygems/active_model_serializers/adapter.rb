require 'active_model_serializers'
Order = Struct.new(:sku, :qty, :price, :cost)
Record = Struct.new(:id, :name, :email, :active, :role, :score, :visits, :joined, :bio, :orders, :password_hash, :internal_note)

# Untimed, once per fixture: the fixture's JSON becomes record objects.
def prepare(input)
  input.map do |r|
    orders = r['orders'].map { |o| Order.new(o['sku'], o['qty'], o['price'], o['cost']) }
    Record.new(r['id'], r['name'], r['email'], r['active'], r['role'], r['score'], r['visits'], r['joined'], r['bio'], orders, r['password_hash'], r['internal_note'])
  end.freeze
end

# ActiveModel::Serializer reads attributes with read_attribute_for_serialization.
class Order
  extend ActiveModel::Naming
  alias_method :read_attribute_for_serialization, :send
end
class Record
  extend ActiveModel::Naming
  alias_method :read_attribute_for_serialization, :send
end

class OrderSerializer < ActiveModel::Serializer
  attributes :sku, :qty, :price
end

class RecordSerializer < ActiveModel::Serializer
  attributes :id, :name, :email, :active, :role, :score, :visits, :joined, :bio
  has_many :orders, serializer: OrderSerializer
end

def operation(records)
  ActiveModelSerializers::SerializableResource.new(records, each_serializer: RecordSerializer).to_json
end
