require 'unf'
def operation(value)
  form = case value[0]
         when 'NFC' then :nfc
         when 'NFD' then :nfd
         when 'NFKC' then :nfkc
         else :nfkd
         end
  UNF::Normalizer.normalize(value[1], form)
end
