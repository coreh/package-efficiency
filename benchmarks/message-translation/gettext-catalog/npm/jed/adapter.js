import { Buffer } from 'node:buffer'
import Jed from 'jed'
import { mo } from 'gettext-parser'
// Untimed, once per fixture: Jed takes its own JSON catalog, so the parsed .mo is converted to it,
// as Jed's documentation does with po2json.
export const prepare = ({ locale, mo: bytes, lookups }) => {
  const parsed = mo.parse(Buffer.from(bytes, 'base64'))
  const data = { '': { domain: 'messages', lang: locale, plural_forms: parsed.headers['plural-forms'] || parsed.headers['Plural-Forms'] } }
  for (const [id, entry] of Object.entries(parsed.translations[''])) {
    if (id !== '') data[id] = entry.msgstr
  }
  return { jed: new Jed({ domain: 'messages', locale_data: { messages: data } }), lookups }
}
export const operation = ({ jed, lookups }) => {
  const out = new Array(lookups.length)
  for (let i = 0; i < lookups.length; i++) {
    const l = lookups[i]
    const text = l.plural === undefined ? jed.gettext(l.msgid) : jed.ngettext(l.msgid, l.plural, l.n)
    out[i] = Jed.sprintf(text, ...l.args)
  }
  return out
}
