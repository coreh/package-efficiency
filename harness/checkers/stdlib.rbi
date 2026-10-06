# typed: true
# API signatures used by these fixtures; dynamic JSON contents stay untyped.
class CGI
  sig { params(value: String).returns(String) }
  def self.escapeHTML(value); end
end
