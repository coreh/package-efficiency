from tld import get_tld
from tld.exceptions import TldDomainNotFound

def operation(host):
    try:
        r = get_tld(host, fix_protocol=True, as_object=True)
    except TldDomainNotFound:
        return None
    return [r.subdomain, r.fld, r.tld]
