require 'unicode_utils/nfc'
require 'unicode_utils/nfd'
require 'unicode_utils/nfkc'
require 'unicode_utils/nfkd'
def operation(value)
  case value[0]
  when 'NFC' then UnicodeUtils.nfc(value[1])
  when 'NFD' then UnicodeUtils.nfd(value[1])
  when 'NFKC' then UnicodeUtils.nfkc(value[1])
  else UnicodeUtils.nfkd(value[1])
  end
end
