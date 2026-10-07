require 'unf_ext'
NORMALIZER = UNF::Normalizer.new
def operation(value)
  form = case value[0]
         when 'NFC' then :nfc
         when 'NFD' then :nfd
         when 'NFKC' then :nfkc
         else :nfkd
         end
  NORMALIZER.normalize(value[1], form)
end
