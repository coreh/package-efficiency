require 'addressable/uri'
def operation(value)
  Addressable::URI.parse(value)
end
def describe(u)
  { 'scheme' => u.scheme.to_s, 'userinfo' => u.userinfo.to_s, 'host' => u.host.to_s, 'port' => u.port.to_s, 'path' => u.path.to_s, 'query' => u.query.to_s, 'fragment' => u.fragment.to_s }
end
