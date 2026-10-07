import dns.flags
import dns.message
import dns.name
import dns.rdataclass
import dns.rdatatype
import dns.rdata
import dns.rrset
import dns.rdtypes.ANY.TXT

IN = dns.rdataclass.IN
TYPES = {t: dns.rdatatype.from_text(t) for t in ('A', 'AAAA', 'CNAME', 'MX', 'TXT')}


def operation(inp):
    msg = dns.message.Message(id=inp['id'])
    flags = dns.flags.QR
    if inp['aa']:
        flags |= dns.flags.AA
    if inp['rd']:
        flags |= dns.flags.RD
    if inp['ra']:
        flags |= dns.flags.RA
    msg.flags = flags
    q = inp['question']
    msg.question.append(dns.rrset.RRset(dns.name.from_text(q['name']), IN, TYPES[q['type']]))
    for a in inp['answers']:
        t = a['type']
        d = a['data']
        rdtype = TYPES[t]
        rd: dns.rdata.Rdata
        if t == 'TXT':
            rd = dns.rdtypes.ANY.TXT.TXT(IN, rdtype, d)
        elif t == 'MX':
            rd = dns.rdata.from_text(IN, rdtype, '%d %s' % (d['preference'], d['exchange']))
        else:
            rd = dns.rdata.from_text(IN, rdtype, d)
        rrset = dns.rrset.RRset(dns.name.from_text(a['name']), IN, rdtype)
        rrset.add(rd, a['ttl'])
        msg.answer.append(rrset)
    return msg.to_wire()


def describe(wire):
    return list(wire)
