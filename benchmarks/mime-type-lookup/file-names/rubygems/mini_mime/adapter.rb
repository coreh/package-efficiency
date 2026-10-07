require 'mini_mime'
def operation(value)
  MiniMime.lookup_by_filename(value).content_type
end
