require 'mime/types'
def operation(value)
  MIME::Types[value].first.preferred_extension
end
