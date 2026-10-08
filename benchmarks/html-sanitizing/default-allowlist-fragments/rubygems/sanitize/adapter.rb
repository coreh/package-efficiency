require 'sanitize'
def operation(html)
  Sanitize.fragment(html)
end
