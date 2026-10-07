require 'escape_utils'
def operation(value)
  EscapeUtils.unescape_html(value)
end
