require 'mini_mime'
def operation(value)
  MiniMime.lookup_by_content_type(value).extension
end
