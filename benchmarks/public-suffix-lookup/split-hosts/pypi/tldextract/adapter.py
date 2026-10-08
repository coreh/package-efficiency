import tldextract

# Documented offline use: no suffix list URLs, so the bundled snapshot is used.
_extract = tldextract.TLDExtract(suffix_list_urls=())

def operation(host):
    r = _extract(host)
    if not r.domain or not r.suffix:
        return None
    return [r.subdomain, r.registered_domain, r.suffix]
