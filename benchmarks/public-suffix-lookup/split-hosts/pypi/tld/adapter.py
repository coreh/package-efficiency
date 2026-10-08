from tld import get_tld
from tld.exceptions import TldDomainNotFound

def operation(host):
    try:
        r = get_tld(host, fix_protocol=True, as_object=True)
    except TldDomainNotFound:
        return None
    # A host that is only a suffix comes back as its own "fld": no registrable domain.
    return None if r.fld == r.tld else r.fld
