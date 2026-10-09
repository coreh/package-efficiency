require 'faker'
require 'date'

def operation(input)
  Faker::Config.random = Random.new(input['seed'])
  Array.new(input['count']) do
    {
      'name' => Faker::Name.name,
      'email' => Faker::Internet.email,
      'street' => Faker::Address.street_address,
      'date' => Faker::Date.between(from: Date.new(2000, 1, 1), to: Date.new(2020, 12, 31)).iso8601
    }
  end
end
