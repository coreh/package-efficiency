require 'mini_mime'
def operation(value)
  # A type the gem does not know gives nil; the check then says which one.
  MiniMime.lookup_by_content_type(value)&.extension.to_s
end
