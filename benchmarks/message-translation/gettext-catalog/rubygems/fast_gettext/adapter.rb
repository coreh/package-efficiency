require 'base64'
require 'tmpdir'
require 'fast_gettext'

# Not timed: runs once per fixture. fast_gettext reads .mo files from <path>/<locale>/LC_MESSAGES/<domain>.mo,
# so the bytes are written to a temporary folder first.
def prepare(value)
  locale = value['locale']
  domain = "catalog#{value.object_id}"
  dir = Dir.mktmpdir('gettext')
  FileUtils.mkdir_p(File.join(dir, locale, 'LC_MESSAGES'))
  File.binwrite(File.join(dir, locale, 'LC_MESSAGES', "#{domain}.mo"), Base64.decode64(value['mo']))
  FastGettext.add_text_domain(domain, path: dir, type: :mo)
  lookups = value['lookups'].map { |l| [l['msgid'], l['plural'], l['n'], l['args']].freeze }.freeze
  [domain, locale, lookups].freeze
end

def operation(prepared)
  domain, locale, lookups = prepared
  FastGettext.text_domain = domain
  FastGettext.locale = locale
  out = []
  lookups.each do |msgid, plural, n, args|
    text = plural.nil? ? FastGettext._(msgid) : FastGettext.n_(msgid, plural, n)
    out << (text % args)
  end
  out
end
