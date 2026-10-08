require 'base64'
require 'fileutils'
require 'tmpdir'
require 'gettext'

# Not timed: runs once per fixture. The gem reads .mo files from <path>/<locale>/LC_MESSAGES/<domain>.mo,
# so the bytes are written to a temporary folder first; the domain is bound to a class of its own.
def prepare(value)
  locale = value['locale']
  domain = "catalog#{value.object_id}"
  dir = Dir.mktmpdir('gettext')
  FileUtils.mkdir_p(File.join(dir, locale, 'LC_MESSAGES'))
  File.binwrite(File.join(dir, locale, 'LC_MESSAGES', "#{domain}.mo"), Base64.decode64(value['mo']))
  translator = Class.new do
    include GetText
    bindtextdomain(domain, path: dir)
  end.new
  lookups = value['lookups'].map { |l| [l['msgid'], l['plural'], l['n'], l['args']].freeze }.freeze
  [translator, locale, lookups].freeze
end

def operation(prepared)
  translator, locale, lookups = prepared
  GetText.locale = locale
  out = []
  lookups.each do |msgid, plural, n, args|
    text = plural.nil? ? translator._(msgid) : translator.n_(msgid, plural, n)
    out << (text % args)
  end
  out
end
