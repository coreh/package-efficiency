import { strict as assert } from 'node:assert'
// Each pool entry is [bytes as hex, the text they decode to]. The bytes were produced by an
// independent encoder (CPython's codecs), so no package under test makes its own expectations.
// Only characters that every WHATWG-conforming and classic decoder agree on are used.
const pools = {
 "Shift_JIS": [
  [
   "93fa967b8cea82cc95b68fcd82f08f88979d82b582dc82b78142",
   "日本語の文章を処理します。"
  ],
  [
   "82d082e782aa82c882c6834a835e834a836981418abf8e9a82aa8dac8ddd82b782e995b682c582b78142",
   "ひらがなとカタカナ、漢字が混在する文です。"
  ],
  [
   "826082618262825082518252814091538a70897090948e9a8149",
   "ＡＢＣ１２３　全角英数字！"
  ],
  [
   "938c8b9e814591e58de381458b9e937382d68d7382ab82dc82b582bd8142",
   "東京・大阪・京都へ行きました。"
  ],
  [
   "82b182ea82cd83658358836782c582b781698a6d9446816a8142",
   "これはテストです（確認）。"
  ],
  [
   "817588f89770817682c681778f9196bc817882c582b78142",
   "「引用」と『書名』です。"
  ],
  [
   "8352839383738385815b835e82cc90ab945c82f091aa92e882b582c481418c8b89ca82f094e48a7282b782e98142",
   "コンピュータの性能を測定して、結果を比較する。"
  ],
  [
   "835c8374836783458346834182cc836f815b83578387839382f08d58905682b582dc82b582bd8142",
   "ソフトウェアのバージョンを更新しました。"
  ]
 ],
 "GBK": [
  [
   "d6d0bbaac8cbc3f1b9b2bacdb9facac7d2bbb8f6ceb0b4f3b5c4b9fabcd2a1a3",
   "中华人民共和国是一个伟大的国家。"
  ],
  [
   "ced2c3c7d5fdd4dab2e2cad4bcc6cbe3bbfac8edbcfea3acc7ebc9d4b5c8a3a1",
   "我们正在测试计算机软件，请稍等！"
  ],
  [
   "babad7d6b1e0c2ebd7aabbbba3babcf2cce5d6d0cec4cec4b1bea1a3",
   "汉字编码转换：简体中文文本。"
  ],
  [
   "a1b0c4e3bac3a1b1a3accbfbcbb5a3aca1b6b3ccd0f2c9e8bcc6a1b7badcd3d0d3c3a3bf",
   "“你好”，他说，《程序设计》很有用？"
  ],
  [
   "b1b1bea9a1a2c9cfbaa3a1a2b9e3d6dda1a2c9eedbdaa3a8d2bbcfdfb3c7cad0a3a9a1a3",
   "北京、上海、广州、深圳（一线城市）。"
  ],
  [
   "cafdbeddbfe2d3ebcdf8c2e7cda8d0c5d0add2e9a1a3",
   "数据库与网络通信协议。"
  ],
  [
   "c8edbcfeb0fcb5c4d0a7c2cac8a1bef6d3dab4a6c0edc6f7cab1bce4bacdc4dab4e6d5bcd3c3a1a3",
   "软件包的效率取决于处理器时间和内存占用。"
  ],
  [
   "c7ebbcecb2e9cae4c8ebcac7b7f1d5fdc8b7a3acc8bbbaf3d6d8d0c2cce1bdbba1a3",
   "请检查输入是否正确，然后重新提交。"
  ]
 ],
 "windows-1252": [
  [
   "436166e92064e96ae02076752c206e61ef7665206661e76164652e20",
   "Café déjà vu, naïve façade. "
  ],
  [
   "50726963653a20803130302097209371756f7465649420616e64209173696e676c659220746578748520",
   "Price: €100 — “quoted” and ‘single’ text… "
  ],
  [
   "4772f6df652c2053747261df652c20c67369722c209c757672652c20d1616e64fa2e20",
   "Größe, Straße, Æsir, œuvre, Ñandú. "
  ],
  [
   "a92032303236204dfc6c6c657220262053f86e9920bd20b120b020",
   "© 2026 Müller & Søn™ ½ ± ° "
  ],
  [
   "5365f16f72208a6f7374616b6f7669632c209e6c757479206b756e2c208e2e20",
   "Señor Šostakovic, žluty kun, Ž. "
  ],
  [
   "506c61696e204153434949207465787420776974682064696769747320303132333435363738392c20616e642070756e6374756174696f6e2120",
   "Plain ASCII text with digits 0123456789, and punctuation! "
  ],
  [
   "4372e86d65206272fb6ce96520e0206c612063617274652c207472e8732064e96c6963696575782e20",
   "Crème brûlée à la carte, très délicieux. "
  ],
  [
   "c56e67737472f66d2c205a6feb2c20426af6726b20962093736d6172742071756f746573942e20",
   "Ångström, Zoë, Björk – “smart quotes”. "
  ]
 ],
 "EUC-JP": [
  [
   "c6fccbdcb8eca4cecab8becfa4f2bde8cdfda4b7a4dea4b9a1a3",
   "日本語の文章を処理します。"
  ],
  [
   "c5ecb5fea1a6c2e7bae5a1a6b5fec5d4a4d8b9d4a4ada4dea4b7a4bfa1a3",
   "東京・大阪・京都へ行きました。"
  ],
  [
   "a4d2a4e9a4aca4caa4c8a5aba5bfa5aba5caa1a2b4c1bbfaa4acbaaebadfa4b9a4ebcab8a4c7a4b9a1a3",
   "ひらがなとカタカナ、漢字が混在する文です。"
  ],
  [
   "a4b3a4eca4cfa5c6a5b9a5c8a4c7a4b9a1cab3cec7a7a1cba1a3",
   "これはテストです（確認）。"
  ],
  [
   "a1d6b0facdd1a1d7a4c8a1d8bdf1ccbea1d9a4c7a4b9a1a3",
   "「引用」と『書名』です。"
  ],
  [
   "cab8bbfaa5b3a1bca5c9a4cecad1b4b9a4f2b9d4a4a4a4dea4b9a1a3",
   "文字コードの変換を行います。"
  ]
 ],
 "Big5": [
  [
   "a4a4b5d8a5c1b0eabb4fc657ac4fa440add3acfcc452aabaae71c0aca143",
   "中華民國臺灣是一個美麗的島嶼。"
  ],
  [
   "a7daadcca5bfa662b4fab8d5b971b8a3b36ec5e9a141bdd0b579b5a5a149",
   "我們正在測試電腦軟體，請稍等！"
  ],
  [
   "ba7ea672bd73bd58c2e0b4aba147c163c5e9a4a4a4e5a4e5a672a143",
   "漢字編碼轉換：繁體中文文字。"
  ],
  [
   "b8eaaec6ae77bb50baf4b8f4b371b054a8f3a977a143",
   "資料庫與網路通訊協定。"
  ],
  [
   "bb4fa55fa142bb4fa4a4a142b0aab6afa15da544ad6eabb0a5aba15ea143",
   "臺北、臺中、高雄（主要城市）。"
  ],
  [
   "bdd0c0cbac64bfe9a44aac4fa75fa5bfbd54a141b54dabe1adabb773b4a3a5e6a143",
   "請檢查輸入是否正確，然後重新提交。"
  ]
 ],
 "KOI8-R": [
  [
   "f0d2c9d7c5d42c20cdc9d22120fcd4cf20d0d2cfd7c5d2cbc120cbcfc4c9d2cfd7cbc92e",
   "Привет, мир! Это проверка кодировки."
  ],
  [
   "edcfd3cbd7c1202d20d3d4cfccc9c3c120f2cfd3d3c9c92c20f3c1cecbd42df0c5d4c5d2c2d5d2c7202d20cbd5ccd8d4d5d2cec1d120d3d4cfccc9c3c12e",
   "Москва - столица России, Санкт-Петербург - культурная столица."
  ],
  [
   "f0d2cfc7d2c1cdcdcecfc520cfc2c5d3d0c5dec5cec9c520c9dacdc5d2d1c5d4d3d120d0cf20d7d2c5cdc5cec920d0d2cfc3c5d3d3cfd2c12e",
   "Программное обеспечение измеряется по времени процессора."
  ],
  [
   "f3dfc5dbd820d6c520c5dda320dcd4c9c820cdd1c7cbc9c820c6d2c1cec3d5dad3cbc9c820c2d5cccfcb2c20c4c120d7d9d0c5ca20dec1c02e",
   "Съешь же ещё этих мягких французских булок, да выпей чаю."
  ],
  [
   "e2d9d3d4d2c1d120cbcfd2c9decec5d7c1d120ccc9d3c120d0d2d9c7c1c5d420dec5d2c5da20ccc5cec9d7d5c020d3cfc2c1cbd52e",
   "Быстрая коричневая лиса прыгает через ленивую собаку."
  ],
  [
   "ebcfc4c9d2cfd7cbc120d4c5cbd3d4c13a20ebefe92d382c20d2d5d3d3cbc9ca20d1dad9cb2c20dec9d3ccc120303132333435363738392e",
   "Кодировка текста: КОИ-8, русский язык, числа 0123456789."
  ]
 ]
}
const ascii = {
  'Shift_JIS': ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t'],
  'EUC-JP': ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t'],
  'GBK': ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t'],
  'Big5': ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t'],
  'KOI8-R': ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t'],
  'windows-1252': ['Hello, world. ', 'id=42; ', 'x + y = z ', 'line one\nline two\t']
}
const hex = (s) => s.charCodeAt(0) < 128 ? s.charCodeAt(0).toString(16).padStart(2, '0') : ''
const asciiHex = (s) => [...s].map(hex).join('')
const labels = Object.keys(pools)
// Sizes in sentences, from one to a few hundred (about 2 KB to 20 KB of bytes).
const sizes = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
export const cases = []
labels.forEach((label, li) => {
  sizes.forEach((n, si) => {
    let h = '', text = ''
    for (let k = 0; k < n; k++) {
      const [bh, bt] = pools[label][(k * 5 + li + si) % pools[label].length]
      h += bh; text += bt
      if (k % 3 === 2) { const a = ascii[label][(k + si) % 4]; h += asciiHex(a); text += a }
    }
    const bytes = h.match(/../g).map((x) => String.fromCharCode(parseInt(x, 16))).join('')
    // Bytes travel as a binary string: one character (U+0000 to U+00FF) per byte.
    cases.push({ input: { encoding: label, bytes }, expected: text })
  })
})
cases.push({ input: { encoding: 'GBK', bytes: '' }, expected: '' })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: text string required`)
    assert.equal(outputs[i], expected, `fixture ${i} (${input.encoding})`)
    // The text must differ from the raw bytes for non-ASCII content: returning the input fails.
    if (expected.length > 0 && input.bytes.length !== expected.length) assert.notEqual(outputs[i], input.bytes, `fixture ${i}: bytes returned unchanged`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
