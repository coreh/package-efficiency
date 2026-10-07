require 'excon'
require 'json'

def connect(host, port)
  Excon.new("http://#{host}:#{port}", persistent: true)
end

def operation(connection, value)
  JSON.parse(connection.get(path: value['path'], expects: 200).body)
end
