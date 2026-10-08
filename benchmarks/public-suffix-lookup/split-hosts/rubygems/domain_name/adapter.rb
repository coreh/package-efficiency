require 'domain_name'
def operation(host)
  d = DomainName.new(host)
  domain = d.domain
  return nil if domain.nil?
  [host[0, host.length - domain.length].chomp('.'), domain, d.tld]
end
