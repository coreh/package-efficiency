import { Buffer } from 'node:buffer'
import { format } from 'node:util'
import Gettext from 'node-gettext'
import { mo } from 'gettext-parser'
// Untimed, once per fixture: the .mo bytes are parsed with gettext-parser and added to a catalog.
export const prepare = ({ locale, mo: bytes, lookups }) => {
  const gt = new Gettext()
  gt.addTranslations(locale, 'messages', mo.parse(Buffer.from(bytes, 'base64')))
  gt.setLocale(locale)
  return { gt, lookups }
}
export const operation = ({ gt, lookups }) => {
  const out = new Array(lookups.length)
  for (let i = 0; i < lookups.length; i++) {
    const l = lookups[i]
    const text = l.plural === undefined ? gt.gettext(l.msgid) : gt.ngettext(l.msgid, l.plural, l.n)
    out[i] = format(text, ...l.args)
  }
  return out
}
