require 'rails-html-sanitizer'
SANITIZER = Rails::HTML5::SafeListSanitizer.new
def operation(html)
  SANITIZER.sanitize(html)
end
