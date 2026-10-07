require 'unf_ext'
NORMALIZER = UNF::Normalizer.new
def operation(value)
  form = case value[0]
         when 'NFC' then :NFC
         when 'NFD' then :NFD
         when 'NFKC' then :NFKC
         else :NFKD
         end
  NORMALIZER.normalize(value[1], form)
end
