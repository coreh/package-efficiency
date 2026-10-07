require 'escape_utils'
def operation(value)
  EscapeUtils.escape_html(value)
end
