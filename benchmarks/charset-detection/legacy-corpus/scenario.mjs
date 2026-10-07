import { strict as assert } from 'node:assert'

// Builds a byte encoder for a legacy encoding by decoding every one- and
// two-byte sequence with the platform's WHATWG decoder and inverting the table.
const encoders = new Map()
const encoderFor = (label) => {
  if (encoders.has(label)) return encoders.get(label)
  const decoder = new TextDecoder(label)
  const map = new Map()
  for (let b = 0; b < 0x80; b++) map.set(String.fromCharCode(b), [b])
  for (let b = 0x80; b < 0x100; b++) {
    const s = decoder.decode(Uint8Array.of(b))
    if (s.length && !s.includes('�') && !map.has(s)) map.set(s, [b])
  }
  if (!/^(windows|koi8|iso)/.test(label)) {
    for (let lead = 0x81; lead < 0xff; lead++) {
      for (let trail = 0x40; trail < 0xff; trail++) {
        const s = decoder.decode(Uint8Array.of(lead, trail))
        if ([...s].length === 1 && s !== '�' && !map.has(s)) map.set(s, [lead, trail])
      }
    }
  }
  const encode = (text) => {
    const out = []
    for (const ch of text) {
      const bytes = map.get(ch)
      assert.ok(bytes, `${label}: cannot encode ${JSON.stringify(ch)}`)
      out.push(...bytes)
    }
    return Uint8Array.from(out)
  }
  encoders.set(label, encode)
  return encode
}
const utf8 = (text) => new TextEncoder().encode(text)
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

// Sentences per language. Each fixture repeats a rotation of them to a length.
const texts = {
  ja: ['吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。', '東京都は日本の首都であり、世界でも有数の大都市として知られています。', '本日の会議は午後三時から第二会議室で開催されます。資料をご確認ください。', 'この製品は高い品質と使いやすさを兼ね備えており、多くのお客様に選ばれています。', '天気予報によると、明日は全国的に晴れて、気温も上がるでしょう。'],
  ko: ['대한민국은 동아시아의 한반도 남쪽에 위치한 나라로 수도는 서울입니다.', '오늘 회의는 오후 세 시에 두 번째 회의실에서 열립니다. 자료를 확인해 주세요.', '이 제품은 높은 품질과 편리한 사용법으로 많은 고객들에게 사랑받고 있습니다.', '일기예보에 따르면 내일은 전국적으로 맑고 기온도 오를 것으로 보입니다.', '우리는 모두 함께 더 나은 미래를 만들어 갈 수 있다고 믿습니다.'],
  zhs: ['中华人民共和国是位于东亚的国家，首都是北京，人口众多，历史悠久。', '今天的会议将于下午三点在第二会议室举行，请大家查看相关资料。', '这款产品质量优良，使用方便，深受广大用户的喜爱和信赖。', '根据天气预报，明天全国大部分地区晴朗，气温将有所上升。', '我们相信通过共同努力，一定能够创造一个更加美好的未来。'],
  zht: ['中華民國位於東亞，首都為臺北，人口眾多，歷史悠久，文化豐富多彩。', '今天的會議將於下午三點在第二會議室舉行，請大家查看相關資料。', '這款產品品質優良，使用方便，深受廣大用戶的喜愛與信賴。', '根據天氣預報，明天全國大部分地區晴朗，氣溫將有所上升。', '我們相信透過共同努力，一定能夠創造一個更加美好的未來。'],
  ru: ['Москва является столицей России и крупнейшим городом страны с населением более двенадцати миллионов человек.', 'Сегодняшнее заседание состоится в три часа дня во втором зале. Пожалуйста, ознакомьтесь с материалами.', 'Этот продукт отличается высоким качеством и удобством использования, поэтому его выбирают многие клиенты.', 'По прогнозу погоды, завтра по всей стране будет ясно, температура воздуха повысится.', 'Мы верим, что вместе сможем построить лучшее будущее для всех наших детей.'],
  el: ['Η Αθήνα είναι η πρωτεύουσα της Ελλάδας και μία από τις αρχαιότερες πόλεις του κόσμου.', 'Η σημερινή συνεδρίαση θα πραγματοποιηθεί στις τρεις το απόγευμα στη δεύτερη αίθουσα.', 'Αυτό το προϊόν διακρίνεται για την υψηλή ποιότητα και την ευκολία χρήσης του.', 'Σύμφωνα με την πρόγνωση του καιρού, αύριο θα είναι ηλιόλουστα σε όλη τη χώρα.'],
  he: ['ירושלים היא בירת ישראל והעיר הגדולה ביותר בה מבחינת האוכלוסייה והשטח.', 'הישיבה של היום תתקיים בשעה שלוש אחר הצהריים באולם השני. אנא עיינו בחומרים.', 'המוצר הזה מצטיין באיכות גבוהה ובקלות שימוש, ולכן רבים מהלקוחות בוחרים בו.', 'לפי תחזית מזג האוויר, מחר יהיה בהיר בכל רחבי הארץ והטמפרטורה תעלה.'],
  fr: ['Le café était déjà fermé lorsque nous sommes arrivés à l\'hôtel, après une longue journée de voyage à travers la région.', 'Les élèves ont préparé une présentation sur l\'histoire de la Révolution française et ses conséquences européennes.', 'À la fin de l\'été, ils ont décidé de déménager près de la côte où les hivers sont plus doux.', 'Où êtes-vous allés hier soir ? Nous avons dîné chez des amis qui habitent près de l\'église.'],
  de: ['Die Straße führt über die Brücke zum Marktplatz, wo jeden Samstag frisches Gemüse und Käse verkauft werden.', 'Müller möchte wissen, ob die Übersetzung der Gebrauchsanweisung bis nächste Woche fertig sein kann.', 'Für größere Änderungen müssen wir zuerst die Zustimmung aller beteiligten Abteilungen einholen.', 'Über den Wolken muss die Freiheit wohl grenzenlos sein, sagte der alte Fährmann nachdenklich.'],
  es: ['El niño comió piñas y jamón mientras su abuela le contaba historias sobre la vida en el pueblo de montaña.', '¿Cuándo llegará el próximo tren a Sevilla? Además, necesitamos información sobre los horarios del domingo.', 'La reunión de mañana se celebrará en la sala de conferencias, después de la presentación del informe anual.', 'Está prohibido aparcar delante de la salida de emergencia, según la normativa municipal.'],
  mix: ['Español, français, Deutsch, 日本語, 中文, 한국어, русский, ελληνικά, עברית, العربية, ไทย, हिन्दी.', 'Price: 25 € (≈ 27 $) — “quotes”, ‘singles’, • bullet, … ellipsis, ™ trademark, © 2026.', 'Emoji and symbols: 😀 🚀 ✓ ✗ → ← ∑ ∞ ≠ ≤ ≥ π ñ ü é ß ø å.'],
}
const pad = (list, bytes, encode, start) => {
  let s = ''
  for (let i = 0; encode(s).length < bytes; i++) s += list[(start + i) % list.length] + (i % 3 === 2 ? '\n' : ' ')
  return s
}

const specs = []
const add = (lang, label, sizes, extra = {}) => {
  sizes.forEach((bytes, i) => specs.push({ lang, label, bytes, start: i + (extra.shift ?? 0) }))
}
add('ja', 'shift_jis', [300, 1200, 4000])
add('ja', 'euc-jp', [300, 1200, 4000])
add('ko', 'euc-kr', [300, 1200, 4000])
add('zhs', 'gbk', [300, 1200, 4000])
add('zhs', 'gb18030', [800, 3000])
add('zht', 'big5', [300, 1200, 4000])
add('ru', 'windows-1251', [400, 1500, 4000])
add('ru', 'koi8-r', [400, 1500, 4000])
add('el', 'windows-1253', [400, 1500])
add('he', 'windows-1255', [400, 1500])
add('fr', 'windows-1252', [600, 2500])
add('de', 'windows-1252', [600, 2500])
add('es', 'windows-1252', [600, 2500])
for (const lang of ['ja', 'ko', 'zhs', 'ru', 'el', 'fr', 'de', 'es']) add(lang, 'utf-8', [200, 2000], { shift: 1 })
add('mix', 'utf-8', [300, 1500])

// A detector's answer is correct when decoding the bytes with the encoding it
// names (through the WHATWG decoder, which knows every common spelling and
// alias) gives back the original text. This accepts aliases and supersets
// (GB2312 / GBK / GB18030, windows-1252 / ISO-8859-1, KOI8-R / KOI8-U for text
// that uses none of the characters in which they differ) and rejects any
// encoding that reads the bytes as different text.
const fromHex = (h) => Uint8Array.from(h.match(/../g), (b) => parseInt(b, 16))
const decodesTo = (name, input, text) => {
  try {
    return new TextDecoder(String(name).trim(), { ignoreBOM: true }).decode(fromHex(input)) === text
  } catch {
    return false
  }
}

export const cases = specs.map(({ lang, label, bytes, start }) => {
  const encode = label === 'utf-8' ? utf8 : encoderFor(label)
  const text = pad(texts[lang], bytes, encode, start)
  return { input: hex(encode(text)), expected: text }
})

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.ok(decodesTo(outputs[i], input, expected), `fixture ${i}: ${outputs[i]} does not decode the bytes to the original text`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
