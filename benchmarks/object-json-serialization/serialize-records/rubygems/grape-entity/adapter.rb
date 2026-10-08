require 'grape_entity'
require 'json'
Order = Struct.new(:sku, :qty, :price, :cost)
Record = Struct.new(:id, :name, :email, :active, :role, :score, :visits, :joined, :bio, :orders, :password_hash, :internal_note)

# Untimed, once per fixture: the fixture's JSON becomes record objects.
def prepare(input)
  input.map do |r|
    orders = r['orders'].map { |o| Order.new(o['sku'], o['qty'], o['price'], o['cost']) }
    Record.new(r['id'], r['name'], r['email'], r['active'], r['role'], r['score'], r['visits'], r['joined'], r['bio'], orders, r['password_hash'], r['internal_note'])
  end.freeze
end

class OrderEntity < Grape::Entity
  expose :sku, :qty, :price
end

class RecordEntity < Grape::Entity
  expose :id, :name, :email, :active, :role, :score, :visits, :joined, :bio
  expose :orders, using: OrderEntity
end

def operation(records)
  RecordEntity.represent(records).to_json
end
