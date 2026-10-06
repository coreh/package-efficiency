require 'cgi'
def operation(value)
  CGI.escapeHTML(value)
end
