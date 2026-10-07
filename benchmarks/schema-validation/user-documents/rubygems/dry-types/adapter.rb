require 'dry/types'

module Types
  include Dry.Types()
end

def number(**limits)
  Types::Strict::Integer.constrained(**limits) | Types::Strict::Float.constrained(**limits)
end

NUMBER = Types::Strict::Integer | Types::Strict::Float

USER = Types::Hash.schema(
  id: Types::Strict::Integer.constrained(gteq: 1),
  name: Types::Strict::String.constrained(min_size: 1),
  email: Types::Strict::String,
  role: Types::Strict::String.enum('admin', 'editor', 'viewer'),
  active: Types::Strict::Bool,
  tags: Types::Strict::Array.of(Types::Strict::String),
  scores: Types::Strict::Array.of(NUMBER),
  nickname?: Types::Strict::String,
  address: Types::Hash.schema(
    city: Types::Strict::String.constrained(min_size: 1),
    zip: Types::Strict::String,
    geo?: Types::Hash.schema(
      lat: number(gteq: -90, lteq: 90),
      lng: number(gteq: -180, lteq: 180)
    ).with_key_transform(&:to_sym)
  ).with_key_transform(&:to_sym)
).with_key_transform(&:to_sym)

def operation(value)
  USER.valid?(value)
end
