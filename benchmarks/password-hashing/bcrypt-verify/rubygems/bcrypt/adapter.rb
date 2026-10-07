require 'bcrypt'

def operation(value)
  password, first, second = value
  hashed = BCrypt::Password.create(password, cost: 8)
  [hashed == first, hashed == second, hashed.to_s]
end
