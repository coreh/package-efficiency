# An item of the shop. There is no database: an item is computed from its id.
class Item
  TAGS = %w[alpha beta gamma delta].freeze

  attr_reader :id

  def self.find(id)
    new(Integer(id, 10))
  end

  def initialize(id)
    @id = id
  end

  def name = "Item #{id}"
  def price_cents = 199 + (id * 37) % 5000
  def in_stock? = id % 3 != 0
  def discount_percent = (id % 5).zero? ? 15 : 0
  def note = %(Fish & Chips <#{id}> "quoted" it's)
  def tags = TAGS.first(id % 4 + 1)
  def related = (1..12).map { |offset| Item.new(id + offset) }

  # What a related item is listed with.
  def summary
    { id: id, name: name, priceCents: price_cents }
  end

  def as_json(*)
    summary.merge(
      inStock: in_stock?,
      discountPercent: discount_percent,
      note: note,
      tags: tags,
      related: related.map(&:summary)
    )
  end
end
