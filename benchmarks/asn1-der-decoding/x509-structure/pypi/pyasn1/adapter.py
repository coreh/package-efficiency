from pyasn1.codec.der import decoder
from pyasn1.type import univ

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def _walk(obj, out):
    # Without a spec, an explicit tag comes back as the inner type carrying the extra tag,
    # so every tag layer (outermost first) is one element.
    for tag in reversed(obj.tagSet.superTags):
        out.append(tag.tagClass // 64 * 100 + tag.tagId)
    if isinstance(obj, (univ.SequenceOfAndSetOfBase, univ.SequenceAndSetBase)):
        for i in range(len(obj)):
            _walk(obj[i], out)

def operation(der):
    out = []
    _walk(decoder.decode(der)[0], out)
    return out
