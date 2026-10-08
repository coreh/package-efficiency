require 'active_record'

ActiveRecord::Migration.verbose = false
# The connection (one in-memory database) is opened once; each call creates
# the table, uses it and drops it.
ActiveRecord::Base.establish_connection(adapter: 'sqlite3', database: ':memory:')

class User < ActiveRecord::Base
end

def operation(value)
  connection = ActiveRecord::Base.connection
  connection.create_table :users do |t|
    t.string :name
    t.string :city
    t.integer :age
    t.integer :score
  end
  User.reset_column_information
  User.insert_all(value['rows'].map { |name, city, age, score| { name: name, city: city, age: age, score: score } })
  out = User.where(age: value['minAge']..).where.not(city: value['skipCity']).order(score: :desc, id: :asc)
            .map { |u| [u.id, u.name, u.city, u.age, u.score] }
  connection.drop_table :users
  out
end
