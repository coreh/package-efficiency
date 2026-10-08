import tldextract

# Documented offline use: no suffix list URLs, so the bundled snapshot is used.
_extract = tldextract.TLDExtract(suffix_list_urls=())

def operation(host):
    return _extract(host).registered_domain or None
