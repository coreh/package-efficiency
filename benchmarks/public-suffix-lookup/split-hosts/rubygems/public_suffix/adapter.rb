require 'public_suffix'
def operation(host)
  d = PublicSuffix.parse(host)
  [d.trd || '', d.domain, d.tld]
rescue PublicSuffix::DomainNotAllowed
  nil
end
