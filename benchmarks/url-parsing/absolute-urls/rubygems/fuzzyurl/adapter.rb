require 'fuzzyurl'
def operation(value)
  Fuzzyurl.from_string(value)
end
def describe(u)
  { 'scheme' => u.protocol.to_s, 'userinfo' => u.username.to_s + (u.password ? ":#{u.password}" : ''), 'host' => u.hostname.to_s, 'port' => u.port.to_s, 'path' => u.path.to_s, 'query' => u.query.to_s, 'fragment' => u.fragment.to_s }
end
