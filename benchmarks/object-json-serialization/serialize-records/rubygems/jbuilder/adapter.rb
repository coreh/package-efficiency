require 'jbuilder'
Order = Struct.new(:sku, :qty, :price, :cost)
Record = Struct.new(:id, :name, :email, :active, :role, :score, :visits, :joined, :bio, :orders, :password_hash, :internal_note)

# Untimed, once per fixture: the fixture's JSON becomes record objects.
def prepare(input)
  input.map do |r|
    orders = r['orders'].map { |o| Order.new(o['sku'], o['qty'], o['price'], o['cost']) }
    Record.new(r['id'], r['name'], r['email'], r['active'], r['role'], r['score'], r['visits'], r['joined'], r['bio'], orders, r['password_hash'], r['internal_note'])
  end.freeze
end

def operation(records)
  Jbuilder.new do |json|
    json.array!(records) do |r|
      json.id r.id
      json.name r.name
      json.email r.email
      json.active r.active
      json.role r.role
      json.score r.score
      json.visits r.visits
      json.joined r.joined
      json.bio r.bio
      json.orders(r.orders) do |o|
        json.sku o.sku
        json.qty o.qty
        json.price o.price
      end
    end
  end.target!
end
