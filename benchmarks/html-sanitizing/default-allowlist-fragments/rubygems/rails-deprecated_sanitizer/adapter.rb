require 'active_support'
require 'active_support/core_ext/class/attribute'
require 'rails/deprecated_sanitizer'
SANITIZER = HTML::WhiteListSanitizer.new
def operation(html)
  SANITIZER.sanitize(html)
end
