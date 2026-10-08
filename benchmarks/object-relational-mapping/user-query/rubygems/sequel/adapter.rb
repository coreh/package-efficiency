require 'sequel'

# The connection (one in-memory database) is opened once; each call creates
# the table, uses it and drops it. A model reads the table's columns when it
# is declared, so the table exists for that moment only.
DB = Sequel.sqlite
DB.create_table(:users) do
  primary_key :id
  String :name
  String :city
  Integer :age
  Integer :score
end

class User < Sequel::Model(DB[:users])
end

DB.drop_table(:users)

def operation(value)
  DB.create_table(:users) do
    primary_key :id
    String :name
    String :city
    Integer :age
    Integer :score
  end
  User.multi_insert(value['rows'].map { |name, city, age, score| { name: name, city: city, age: age, score: score } })
  out = User.where { age >= value['minAge'] }.exclude(city: value['skipCity']).order(Sequel.desc(:score), :id)
            .map { |u| [u.id, u.name, u.city, u.age, u.score] }
  DB.drop_table(:users)
  out
end
