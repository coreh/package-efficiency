require 'representable/json'
Order = Struct.new(:sku, :qty, :price, :cost)
Record = Struct.new(:id, :name, :email, :active, :role, :score, :visits, :joined, :bio, :orders, :password_hash, :internal_note)

# Untimed, once per fixture: the fixture's JSON becomes record objects.
def prepare(input)
  input.map do |r|
    orders = r['orders'].map { |o| Order.new(o['sku'], o['qty'], o['price'], o['cost']) }
    Record.new(r['id'], r['name'], r['email'], r['active'], r['role'], r['score'], r['visits'], r['joined'], r['bio'], orders, r['password_hash'], r['internal_note'])
  end.freeze
end

class OrderRepresenter < Representable::Decorator
  include Representable::JSON
  property :sku
  property :qty
  property :price
end

class RecordRepresenter < Representable::Decorator
  include Representable::JSON
  property :id
  property :name
  property :email
  property :active
  property :role
  property :score
  property :visits
  property :joined
  property :bio
  collection :orders, decorator: OrderRepresenter
end

class RecordsRepresenter < Representable::Decorator
  include Representable::JSON::Collection
  items decorator: RecordRepresenter
end

def operation(records)
  RecordsRepresenter.new(records).to_json
end
