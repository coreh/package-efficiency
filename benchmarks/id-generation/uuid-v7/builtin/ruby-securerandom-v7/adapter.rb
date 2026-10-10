require 'securerandom'
def operation(value)
  Array.new(value) { SecureRandom.uuid_v7 }
end
