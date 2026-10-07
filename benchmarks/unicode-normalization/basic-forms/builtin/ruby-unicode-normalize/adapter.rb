def operation(value)
  form = case value[0]
         when 'NFC' then :nfc
         when 'NFD' then :nfd
         when 'NFKC' then :nfkc
         else :nfkd
         end
  value[1].unicode_normalize(form)
end
