from pyasn1.codec.der import decoder
from pyasn1_modules import rfc5280

_CN = rfc5280.id_at_commonName

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def _name(name):
    cn = ''
    count = 0
    for rdn in name[0]:
        for atv in rdn:
            count += 1
            if atv['type'] == _CN:
                text, _ = decoder.decode(atv['value'], asn1Spec=rfc5280.DirectoryString())
                cn = str(text.getComponent())
    return cn, count

def _time(t):
    return int(t.getComponent().asDateTime.timestamp())

def operation(der):
    cert, _ = decoder.decode(der, asn1Spec=rfc5280.Certificate())
    tbs = cert['tbsCertificate']
    scn, sn = _name(tbs['subject'])
    icn, ino = _name(tbs['issuer'])
    validity = tbs['validity']
    return {
        'version': int(tbs['version']) + 1,
        'serial': format(int(tbs['serialNumber']), 'x'),
        'subjectCN': scn,
        'issuerCN': icn,
        'subjectAttrs': sn,
        'issuerAttrs': ino,
        'notBefore': _time(validity['notBefore']),
        'notAfter': _time(validity['notAfter']),
        'extensions': len(tbs['extensions']),
    }
