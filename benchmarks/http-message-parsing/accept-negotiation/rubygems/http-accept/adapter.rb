require 'http/accept'

def operation(input)
  HTTP::Accept::MediaTypes.parse(input).select { |range| range.quality_factor > 0 }
end

def describe(result)
  result.map(&:mime_type)
end
