require 'cgi'
def operation(value)
  CGI.unescapeHTML(value)
end
