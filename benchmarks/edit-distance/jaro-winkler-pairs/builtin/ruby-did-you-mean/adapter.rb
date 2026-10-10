require 'did_you_mean'

def operation(value)
  value.map { |pair| DidYouMean::JaroWinkler.distance(pair[0], pair[1]) }
end
