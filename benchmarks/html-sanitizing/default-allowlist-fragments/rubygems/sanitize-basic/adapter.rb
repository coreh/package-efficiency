require 'sanitize'
def operation(html)
  Sanitize.fragment(html, Sanitize::Config::BASIC)
end
