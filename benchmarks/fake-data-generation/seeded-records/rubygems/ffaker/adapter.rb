require 'ffaker'
require 'date'

def operation(input)
  FFaker::Random.seed = input['seed']
  Array.new(input['count']) do
    {
      'name' => FFaker::Name.name,
      'email' => FFaker::Internet.email,
      'street' => FFaker::Address.street_address,
      'date' => FFaker::Time.between(Time.utc(2000, 1, 1), Time.utc(2020, 12, 31)).to_date.iso8601
    }
  end
end
