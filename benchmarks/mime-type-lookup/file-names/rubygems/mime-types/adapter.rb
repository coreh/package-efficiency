require 'mime/types'
def operation(value)
  MIME::Types.type_for(value).first.to_s
end
