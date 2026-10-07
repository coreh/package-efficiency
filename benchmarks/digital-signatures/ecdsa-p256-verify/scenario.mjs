import { strict as assert } from 'node:assert'
import { createECDH, createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto'
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve', '😀 ok', 'request', 'user', 'session']
const unit = (i) => [
  (j) => `${words[(i + j) % words.length]}-${j} `,
  (j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO user=${i * 31 + j} path=/api/v1/items/${j} status=${200 + (j % 5)}\n`,
  (j) => JSON.stringify({ id: i * 1000 + j, name: words[(i + j) % words.length], tags: ['a', 'b', j], ok: j % 2 === 0 }),
  (j) => `${words[(i * 7 + j) % words.length]} éè 日本 ${j} `,
][i % 4]
const make = (i, length) => {
  const make1 = unit(i)
  let s = ''
  for (let j = 0; s.length < length; j++) s += make1(j)
  return s.slice(0, length).replace(/[\ud800-\udbff]$/, '')
}
const lengths = [1, 2, 3, 15, 31, 32, 54, 55, 63, 64, 65, 100, 111, 112, 127, 128, 129, 200, 255, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4000, 4096, 5000, 6000, 8000, 8192, 20, 40, 80, 160, 320, 640, 1280, 64, 64, 32, 5, 0]
const N = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n
const toHex = (b) => Buffer.from(b).toString('hex')
// 48 keys, deterministic: private scalar derived from a hash, loaded as a JWK.
const keys = lengths.map((_, i) => {
  const d = BigInt('0x' + createHash('sha256').update(`p256-fixture-${i}`).digest('hex')) % (N - 1n) + 1n
  const dHex = d.toString(16).padStart(64, '0')
  return dHex
})
const material = keys.map((dHex) => {
  const ecdh = createECDH('prime256v1')
  ecdh.setPrivateKey(Buffer.from(dHex, 'hex'))
  const pub = ecdh.getPublicKey()
  return { pub: toHex(pub) }
})
// One signature per key over its message, r then s. ECDSA signing draws a
// random nonce, so these were produced once (node:crypto sign with each key
// above, normalised to low-s) and are kept here: every process and every
// fixture export then verifies the same 48 signatures.
const signatures = [
  'da3b480c9fde6fa85a1cb6917d4b7b30a5ceb90826ba2b5cfd02faeb650a68cb7742242091e82ccfe8ddae92643f586a3e87776a8d0554a5582832a98f4ceabe',
  '19cfe659b1d497569602c249f67b52ed744fba84bbdbf1f2502f3bf84a11c6532baa18651f9395a8fcbea002132a4831ac86f343e3aa8cec823af701a36a5ffa',
  'fb20bdcd5ada34048ea42b45727271af0c89be86566cf29581d78c39fde56d202c18b668d52ab60ee1ec59724d984986a467d65d0105521357d09368a0a37b88',
  'dcc60119b63d5ee6d8a632671e56a614afdb2cf3e938d6e263ac3fc67707fe6737a0de704ac6e032cc274d37c26dd7b25501d9aaa0eadb423e9cada019b2aa68',
  '63f09a90daea1b51438231e1546ebf8b8910a950c50524e89250cbc5049b986d14f2003a711e1f228f145701bbe13cff34a19486ce3aea18f08f8e0da7aff4af',
  '21704bea2ba3eeb4257eb462ab1ed06dcda3e99665b7e878b0f77ce149dd4708370126b2ba7398e75fae5dab7071b3d0b2ea4e2a0429df44d6ef3ffc5f8fcf8f',
  'fa7fb62bbddb88727cd6ebe5f29e68e72834dbe44c6b5d9c46d40ddcdb3243996d81e601c117dae7ee49dc7f7fc3ad35a8d8e6837551a9b70bec54adabc63d31',
  'fb64c0ab6d335d76c9547de944a36b01a36e0b887970ed6486eccfe406a6f4e944c4416c7869d4bd76162f491b47dea73e2d039e900c0e1799dffb807f9bd469',
  'eb6b67e8e7ba193472a537c309272bf64eb7d369b24eebfec880a902ea3ef8d734ec37217610cc8240af0cc5a548d1a1b1f462ead43464b542d0765e85a73343',
  '6bd3d2ea45c4a5a0675120f792054a8de484c56948bbc3ae1c3d9a28639599d31e90a375a844d5ce19fd8ae35f4b503b122d8fab229fa6a440079457327234e0',
  '7c8bfe1249cbeba49f6765cf61544c484488bf9c46557666ed6e586c813a6e585862fa7ececeaea5397a7394e9c87c8ed40a4f3844982dbfa2c140cbbf91798b',
  'a7ba2714b1e77bdaac9f34041d798eea24a2d45fac8d4d2c614d5503be78fca779b8dfb9f976e7189a21f27d2db90a9cec11c21a21c7c61b442bac115cffd3c1',
  'ff81212f2728ba60e2354671f21304a5b7c4de330ae3d19f805939f70c3f735c3206d42eda3eb5a0582dd957b24e2b3b5f80f068bc2224a91ca517e0da5dc763',
  '45148afeb47780016c5104eef112b1504f1daaba786576b86f165aaf829e802610f5ff3b794451e371e9f21245170577947eb04dcce4434d8c76d5206925a1ed',
  'e14d6154a1110d13e90a56d9729f840397aada54aa38280661ff5cb5cf9108dd294ec130d349b3e068579b02e42b09a4639496a9c4189638f8e3847dd30bb347',
  'aefd7e38659c0c1fcd592d7fe3b1022ea1773b668505272751651f89fa5527b229714101e6c18511e7a99719012fd1a81ce8fcc990bc3fc64a4e943a39638b1c',
  '052d871af03c885a6c419c5a634e6dabf3a9f74f0ca9c6008058c2f749d018d02ac899b872ac8d8d2de2e9839df0ce11c90c47a3e480885c75a83615171e58ec',
  '6c4b0a5c07e82d4890cd041ba16845fbbdfcc72e97a8da929e460c24aa9ba5845bf2abbfff2e4a5ed47fb32f5ffc6617de5f31711123ab34f475321abe4917e4',
  '188a54616ee3230473fa5a39e11f025f8371e39e1fe48cec5af6fad61ff1047f5fa14d4c4cf913e21c5cb7e64113fe421e91ade0f66e46576ec6981f334bfa7c',
  'f74d6556c02f15f06cd6b25626d177d1b343dd5d7c5ac8bb48c6fe69a0763b666836f75150dafe685666c652525a7e0f2f5b4add7efbfbbd0abfe95d2371b045',
  'a51ec9a1d4f911bb22caea3bdbe68bef0652709f873f41cd2737f893462bec4a4bd695deddf404ee652e246dedefb9d2b32d47b477f9b124eb7bff95b3381f12',
  '61a8be80514ad04b47cfde83846753c47aba8efb8f564939b700e7ef8f42bedc2d997c12a7db5ea72e3b260a14c8a0ec1d0b2413e3f2a5a3d68111e26a5cdd64',
  'e295dae4d4c086c009e7388e54115e38d777b015e38484f436eac8719a9f556c37c6653cdb53d6a95427f8497cc4b07845140cb330c28da74588047558a83591',
  '9ec8f784d7a103f091a8887b74189f0c28c497cef9d8c6296b271bdada735f070a5c93e492efcab04379c4e383c46499eb82481ab97e93dcd6672ea542668001',
  '43ad808a6baccb0c3a4fa2d6d77fb2f2201475dd4588bd5c7f8f63aa3774513e773bb4bdf66c16022e152b8e5591a3f8f647cfdf12d7d96a59be2df40b49c2bb',
  'c43d50373af71ad1c9d8a495686098252fb52d2579ed834bb768a263265ea16d262cc0541d19ed1e16fabc38c1664c9f9d46ca146b14cf99b7a4592397981264',
  '0c8ad5192d01c52716f5b57e63adea31d3dbd8b9c2f232cdac8eb11a260d3fbf5fc9f7fc7183f70b217cb04943cd39f51b20fb128e16b057885a8f4e534b6668',
  '3ba7cae7a58c5ad4674129f13e944b54a5db17547a9b37e4acdb711d3a7d90bd1127e20023e58311dfd58c8dd6dffa925bf1e3dacab0ce1d9549f97854e24996',
  '9e3fe8b9fd07e873c0f9cd88b1b349163c995d648d9205e69d41b9b0539599eb42411c1e2598d461e28fb14d94ce4fc3f7d2fd2f072618a1990ab994cffafadd',
  'fc493114a183d414cb491dcf17b557c61fe168aece75b6f611172046e8b4a86228976b43fa29abe390090617e60d3d7c092b4a95815713fd9cffadf962836d50',
  'e05a0ee54f61937c846c9225d462f789fdf7fe6580642b631d6455adf780d37572c97879e515b8164f06b10b5d836a6940845302cdd345fa80395bafefffed48',
  '5c836376ef822e333cbffba6fb680214863fa93c0ec1e8f27d315285167f00c0525227a1c9df117e2fce87e0080ffffcddb4eb44a839be8cb5f62bceea38fdb8',
  '98b5e032b92ea859fa462f33aa1a6806037971d9bc4cca1c6e71f1ede8d57b57658d581e637d3d80ce90a8eb36cff45baf3983b82369266cd69024e87b9e639e',
  '6382ccc712ed382adf23df78e048f7f074349f1bbcb366a691cdd6e7cd76096c0836d5ab824df765d554a9c752686166f531f774daeb83d202e8b87b7c870513',
  '51c3b6b9616f848d00e449f8fe5648856655db5332a584b312b50571a059fd92544049d1ce76d3a843fa0da2e588d39ff6505c4bbcfbf3a6d493062c15f27025',
  'd9c1629084779758e2cc09ca2dbacfe3309d79194cae2f3ff3da921aae94e2b316e2a2fbe2fe52cf70055b48bc174560c01250213a0c18e446ce1bef1ac0aadc',
  'a74b85a3ee3aba613c1674cccab2cb806b642769ee7a2f1436715513ea8d92b52dff7f464f3718dd39e030048b59de774863518781d66742076f2fb4f4611d75',
  '64cb5df90d889c182ff517b170607aa6cb8d7ee285a756f49ed678961280f2251c3c4542e0f155948a66a363a0757782cba44621f48e04b7f6b51748bb0c78d3',
  '442c799ed111645fe7676c87a879876e4374d4a6970f8104d534f1ada246755835cdcd9c14fe74730d34931785c746e8ace649f2c18a47b8d42b18a3a4efd0fd',
  'a8fd554e767f23ebe3838d176887d83e6ae27b61f5009b471aba5297eaf66a075b421af7e7d94ff439d1be7c14944b00607093cdadddc0fe6d8d4115dd464ffb',
  'f226825d1f4b9c107ee2a57691747583bda78b911298e4bd436c62e3fd3353013b2d89f404ca3aad56f882d574e3984068ab82cac29decc5e0af60c5865bba62',
  '4b0c21e6b5bd0aa670532de2d103c69fc1c5afe788473706135a678569beac387a156af87ac80c9cfcaa9e41c63524fa8f1548ae3699d24ee4a96a517bd7b56f',
  '33751ce9db46bd4380c2f6a8791d2c76c593951c63ce254e072dbd4fd09795156299dd8d0181b647a4aa1bb61172fa3ddfb3f437cc130b092e8c8f7cd192a96a',
  '820867b0962d66897ec617f8790153f321cc41b3da8b6d5a6c5490856f0c527117115b5f7b3de70db838035443b3db580fb869e290b52285a1ab4293c915bc38',
  '60fd81b6363af8a2cfa8e9a29c9bb998284b3a5e67f3ce14ceadecc97b0a2f94569b6b5e67674dc77c2d4a1e603a0925388f598d1ee4cbafb12b298c0c5be643',
  '3d1f4415aadad09f25b35d0b591918c0a59dd078c732dbe62e6f61c59936a15373f170a07b06b071e5995a01a003851fdd81e2d56e68d26b7a9abb31e831c7cc',
  '5e11837c17bfa3a46e5ce4bf439873262a2ba6c2a6b2e9460ff2bb24e033820755e4bbf28c9fa85beba9d2f48d5a2635a32fad967d6496cbd0820d9da49f027f',
  '4cfa8c5e9ba0d31fdb42b3a67c5f883999a6925fa0486994d81d78f6377d021557ab002061e19fffbe8eebea9984c235b713a232981f94553a316d3bc3defae5',
]
assert.equal(signatures.length, lengths.length)
export const cases = lengths.map((length, i) => {
  const message = make(i, length)
  const { pub } = material[i]
  const sig = Buffer.from(signatures[i], 'hex')
  assert.ok(BigInt('0x' + signatures[i].slice(64)) <= N / 2n, `fixture ${i}: low-s signature`)
  const kind = i % 2 === 0 ? 'valid' : ['message', 'signature', 'key'][(i >> 1) % 3]
  let input = { publicKey: pub, signature: toHex(sig), message }
  if (kind === 'message') {
    // change the message by appending one character
    input.message = message + 'x'
  } else if (kind === 'signature') {
    const b = Buffer.from(sig)
    b[63] ^= 1
    input.signature = toHex(b)
  } else if (kind === 'key') input.publicKey = material[(i + 1) % material.length].pub
  return { input, expected: kind === 'valid', kind }
})
// Expectations are known from construction. node:crypto must agree with every
// one of them, which also shows the stored signatures still match the keys and
// messages generated above. (The node:crypto entry is therefore checked
// against the same library; the other entries are not.)
const SPKI = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex')
for (const [i, { input, expected, kind }] of cases.entries()) {
  const key = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(input.publicKey, 'hex')]), format: 'der', type: 'spki' })
  const ok = cryptoVerify('sha256', Buffer.from(input.message, 'utf8'), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(input.signature, 'hex'))
  assert.strictEqual(ok, expected, `fixture ${i} (${kind}): node:crypto disagrees with the construction`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected, kind }] of cases.entries()) assert.strictEqual(outputs[i], expected, `fixture ${i} (${kind})`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value ? 1 : 0)
