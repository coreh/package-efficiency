import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'

// Message catalogs in two locales (en with 2 plural forms, ru with 3), written as
// GNU gettext .mo bytes by the scenario itself. Every fixture hands an adapter the
// .mo file (base64) and 50 lookups; the expected strings come from the scenario's
// own source data, a plural-rule function and a printf for %s and %d, no library.
const topics = ['inbox', 'drafts', 'archive', 'settings', 'billing', 'team', 'reports', 'alerts', 'calendar', 'files', 'search', 'profile']
const topicsRu = ['входящих', 'черновиках', 'архиве', 'настройках', 'платежах', 'команде', 'отчётах', 'уведомлениях', 'календаре', 'файлах', 'поиске', 'профиле']
const nouns = [
  ['file', 'файл', 'файла', 'файлов'], ['photo', 'фото', 'фото', 'фото'], ['message', 'сообщение', 'сообщения', 'сообщений'],
  ['task', 'задача', 'задачи', 'задач'], ['invoice', 'счёт', 'счёта', 'счетов'], ['comment', 'комментарий', 'комментария', 'комментариев'],
]
const names = ['Ana', 'José', 'Zoë', 'Ольга', 'Bob', 'Mei', 'Søren', 'Łukasz', 'Dmitri', 'Chloé']
const counts = [0, 1, 2, 3, 4, 5, 7, 11, 12, 14, 19, 20, 21, 22, 25, 31, 42, 101, 111, 112, 121, 1000, 1001, 2024]
const COUNT = 96

export const pluralForms = {
  en: { header: 'nplurals=2; plural=(n != 1);', index: (n) => (n !== 1 ? 1 : 0) },
  ru: {
    header: 'nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);',
    index: (n) => (n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
  },
}

// Source messages: i % 4 selects the shape; 0 and 1 are singular, 2 and 3 have plural forms.
const source = (i) => {
  const topic = topics[i % topics.length], noun = nouns[i % nouns.length]
  switch (i % 4) {
    case 0: return { msgid: `Welcome back, %s! You have news in ${topic} (${i})`, args: 's',
      en: [`Hi %s, there is news in ${topic} (${i})`], ru: [`Привет, %s! Есть новости в ${topicsRu[i % topics.length]} (${i})`] }
    case 1: return { msgid: `%s sent %d invitations to ${topic} (${i})`, args: 'sd',
      en: [`%s has invited %d people to ${topic} (${i})`], ru: [`%s отправил(а) приглашений: %d, раздел ${topicsRu[i % topics.length]} (${i})`] }
    case 2: return { msgid: `%d ${noun[0]} selected (${i})`, plural: `%d ${noun[0]}s selected (${i})`, args: 'd',
      en: [`%d ${noun[0]} chosen (${i})`, `%d ${noun[0]}s chosen (${i})`], ru: [`Выбран %d ${noun[1]} (${i})`, `Выбрано %d ${noun[2]} (${i})`, `Выбрано %d ${noun[3]} (${i})`] }
    default: return { msgid: `%s deleted %d ${noun[0]} (${i})`, plural: `%s deleted %d ${noun[0]}s (${i})`, args: 'sd',
      en: [`%s removed %d ${noun[0]} (${i})`, `%s removed %d ${noun[0]}s (${i})`], ru: [`%s удалил(а): %d ${noun[1]} (${i})`, `%s удалил(а): %d ${noun[2]} (${i})`, `%s удалил(а): %d ${noun[3]} (${i})`] }
  }
}
const messages = Array.from({ length: COUNT }, (_, i) => source(i))

// A .mo file: header entry, then messages sorted by original bytes, no hash table.
const writeMo = (locale) => {
  const entries = [['', `Language: ${locale}\nContent-Type: text/plain; charset=UTF-8\nPlural-Forms: ${pluralForms[locale].header}\n`]]
  for (const m of messages) entries.push([m.plural ? `${m.msgid}\0${m.plural}` : m.msgid, m[locale].join('\0')])
  const enc = entries.map(([o, t]) => [Buffer.from(o, 'utf8'), Buffer.from(t, 'utf8')])
  enc.sort((a, b) => Buffer.compare(a[0], b[0]))
  const n = enc.length, head = 28, dataStart = head + 16 * n
  const out = Buffer.alloc(dataStart)
  const parts = []
  let pos = dataStart
  const put = (b) => { const at = pos; parts.push(b, Buffer.from([0])); pos += b.length + 1; return at }
  const origs = enc.map(([o]) => [o.length, put(o)]), trans = enc.map(([, t]) => [t.length, put(t)])
  out.writeUInt32LE(0x950412de, 0); out.writeUInt32LE(0, 4); out.writeUInt32LE(n, 8)
  out.writeUInt32LE(head, 12); out.writeUInt32LE(head + 8 * n, 16); out.writeUInt32LE(0, 20); out.writeUInt32LE(dataStart, 24)
  origs.forEach(([l, o], k) => { out.writeUInt32LE(l, head + 8 * k); out.writeUInt32LE(o, head + 8 * k + 4) })
  trans.forEach(([l, o], k) => { out.writeUInt32LE(l, head + 8 * n + 8 * k); out.writeUInt32LE(o, head + 8 * n + 8 * k + 4) })
  return Buffer.concat([out, ...parts])
}
const catalogs = { en: writeMo('en').toString('base64'), ru: writeMo('ru').toString('base64') }

// Deterministic lookups. Every tenth one is not in the catalog (the message comes back as written,
// with the English rule for plurals). Untranslated plurals are only in the en fixtures: for another
// locale the packages differ on the form to use (see task.md).
let seed = 20261007
const rand = (k) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) % k }
const lookup = (locale, k) => {
  if (k % 10 === 9) {
    const t = locale === 'ru' ? rand(2) : rand(4), name = names[rand(names.length)], n = counts[rand(counts.length)]
    if (t === 0) return { msgid: `Unknown %s (${k})`, args: [name] }
    if (t === 1) return { msgid: `Missing %s %d (${k})`, args: [name, n] }
    if (t === 2) return { msgid: `%d item left (${k})`, plural: `%d items left (${k})`, n, args: [n] }
    return { msgid: `%s has %d note (${k})`, plural: `%s has %d notes (${k})`, n, args: [name, n] }
  }
  const m = messages[rand(COUNT)], name = names[rand(names.length)], n = counts[rand(counts.length)]
  const args = m.args === 's' ? [name] : m.args === 'd' ? [n] : [name, n]
  return m.plural ? { msgid: m.msgid, plural: m.plural, n, args } : { msgid: m.msgid, args }
}
const LOCALES = ['en', 'ru', 'ru', 'en', 'ru', 'ru', 'en', 'ru']
export const cases = LOCALES.map((locale, f) => ({
  input: { locale, mo: catalogs[locale], lookups: Array.from({ length: 50 }, (_, k) => lookup(locale, k + f)) },
}))

// Reference: look the message up in the source data, choose the form, fill the placeholders.
const sprintf = (format, args) => { let k = 0; return format.replace(/%[sd]/g, () => String(args[k++])) }
const expectedOne = (locale, l) => {
  const m = messages.find((x) => x.msgid === l.msgid)
  const forms = m ? m[locale] : null
  const form = forms ? (l.plural ? forms[pluralForms[locale].index(l.n)] : forms[0]) : (l.plural && l.n !== 1 ? l.plural : l.msgid)
  return sprintf(form, l.args)
}
const expected = cases.map(({ input }) => input.lookups.map((l) => expectedOne(input.locale, l)))
// The check can fail: the message as written, and the English plural rule used for ru, must both be wrong somewhere in every fixture.
cases.forEach(({ input }, f) => {
  const asWritten = input.lookups.map((l) => sprintf(l.plural && l.n !== 1 ? l.plural : l.msgid, l.args))
  assert.notDeepEqual(asWritten, expected[f], `fixture ${f}: the messages as written must not pass`)
  if (input.locale === 'ru') {
    const english = input.lookups.map((l) => { const m = messages.find((x) => x.msgid === l.msgid); return m ? sprintf(l.plural ? m.ru[Math.min(pluralForms.en.index(l.n), 2)] : m.ru[0], l.args) : sprintf(l.plural && l.n !== 1 ? l.plural : l.msgid, l.args) })
    assert.notDeepEqual(english, expected[f], `fixture ${f}: the wrong plural rule must not pass`)
  }
})
export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output), `fixture ${i}: a list of strings is required`)
  assert.equal(output.length, expected[i].length, `fixture ${i}: one string per lookup`)
  output.forEach((s, k) => assert.equal(s, expected[i][k], `fixture ${i}, lookup ${k} (${JSON.stringify(cases[i].input.lookups[k])}): got ${JSON.stringify(s)}, expected ${JSON.stringify(expected[i][k])}`))
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
