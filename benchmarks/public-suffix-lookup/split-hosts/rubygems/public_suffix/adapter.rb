require 'public_suffix'
def operation(host)
  PublicSuffix.domain(host)
end
