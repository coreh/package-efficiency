require 'uri'
def operation(value)
  URI.parse(value)
end
def describe(u)
  { 'scheme' => u.scheme.to_s, 'userinfo' => u.userinfo.to_s, 'host' => u.host.to_s, 'port' => u.port == u.default_port ? '' : u.port.to_s, 'path' => (u.is_a?(URI::FTP) ? '/' : '') + u.path.to_s + (u.is_a?(URI::FTP) && u.typecode ? ";type=#{u.typecode}" : ''), 'query' => u.query.to_s, 'fragment' => u.fragment.to_s }
end
