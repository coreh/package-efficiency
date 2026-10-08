require 'domain_name'
def operation(host)
  DomainName.new(host).domain
end
