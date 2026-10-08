import base64
import io
from babel.support import Translations

# Not timed: runs once per fixture.
def prepare(value):
    t = Translations(fp=io.BytesIO(base64.b64decode(value["mo"])))
    return (t, [(l["msgid"], l.get("plural"), l.get("n"), tuple(l["args"])) for l in value["lookups"]])

def operation(prepared):
    t, lookups = prepared
    out = []
    for msgid, plural, n, args in lookups:
        text = t.gettext(msgid) if plural is None else t.ngettext(msgid, plural, n)
        out.append(text % args)
    return out
