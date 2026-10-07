from asn1crypto import x509

_VERSION = {'v1': 1, 'v2': 2, 'v3': 3}

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def _count(name):
    return sum(len(rdn) for rdn in name.chosen)

def operation(der):
    cert = x509.Certificate.load(der)
    tbs = cert['tbs_certificate']
    subject = tbs['subject']
    issuer = tbs['issuer']
    validity = tbs['validity']
    return {
        'version': _VERSION[tbs['version'].native],
        'serial': format(tbs['serial_number'].native, 'x'),
        'subjectCN': subject.native.get('common_name', ''),
        'issuerCN': issuer.native.get('common_name', ''),
        'subjectAttrs': _count(subject),
        'issuerAttrs': _count(issuer),
        'notBefore': int(validity['not_before'].native.timestamp()),
        'notAfter': int(validity['not_after'].native.timestamp()),
        'extensions': len(tbs['extensions']),
    }
